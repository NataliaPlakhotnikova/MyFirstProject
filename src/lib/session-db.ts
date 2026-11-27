import { generateLotoCard } from "@/lib/loto/card-generator";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Session, WinModes } from "@/lib/types";
import { PILOT_MAX_CARDS_PER_PLAYER } from "@/lib/loto/constants";

function slugify(): string {
  const part = crypto.randomUUID().split("-")[0];
  return `loto-${part}`;
}

export async function createSession(cardsPerPlayer: number): Promise<Session> {
  const capped = Math.min(cardsPerPlayer, PILOT_MAX_CARDS_PER_PLAYER);
  const supabase = createAdminClient();
  const slug = slugify();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      slug,
      cards_per_player: capped,
      status: "draft",
      registration_open: false,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "create session failed");
  return data as Session;
}

export async function getSessionBySlug(slug: string): Promise<Session | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("sessions").select("*").eq("slug", slug).maybeSingle();
  return (data as Session) ?? null;
}

export async function getSessionByHostToken(token: string): Promise<Session | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("host_token", token)
    .maybeSingle();
  return (data as Session) ?? null;
}

export async function updateSession(
  sessionId: string,
  patch: Partial<{
    status: Session["status"];
    registration_open: boolean;
    cards_per_player: number;
    win_modes: WinModes;
  }>,
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sessions").update(patch).eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function registerPlayer(input: {
  sessionId: string;
  email: string;
  nickname?: string;
  authUserId?: string;
  consentAt: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("players")
    .upsert(
      {
        session_id: input.sessionId,
        email: input.email.toLowerCase().trim(),
        nickname: input.nickname?.trim() || null,
        auth_user_id: input.authUserId ?? null,
        consent_pd_at: input.consentAt,
      },
      { onConflict: "session_id,email" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function generateAllCards(sessionId: string, cardsPerPlayer: number) {
  const supabase = createAdminClient();
  const { data: players, error: pErr } = await supabase
    .from("players")
    .select("id")
    .eq("session_id", sessionId);
  if (pErr) throw new Error(pErr.message);

  const { data: existing } = await supabase
    .from("player_cards")
    .select("id")
    .eq("session_id", sessionId)
    .limit(1);
  if (existing && existing.length > 0) return;

  let nextNumber = 1;
  const allGrids: { grid: ReturnType<typeof generateLotoCard> }[] = [];

  for (const player of players ?? []) {
    for (let c = 0; c < cardsPerPlayer; c++) {
      let grid = generateLotoCard();
      let guard = 0;
      while (
        allGrids.some((g) => JSON.stringify(g.grid) === JSON.stringify(grid)) &&
        guard < 50
      ) {
        grid = generateLotoCard();
        guard++;
      }
      allGrids.push({ grid });

      const { error } = await supabase.from("player_cards").insert({
        session_id: sessionId,
        player_id: player.id,
        card_number: nextNumber++,
        grid,
      });
      if (error) throw new Error(error.message);
    }
  }

  const pool = Array.from({ length: 90 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  await supabase.from("barrel_pool").upsert({
    session_id: sessionId,
    remaining: pool,
  });
}

export async function pickRngCandidate(sessionId: string): Promise<number | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("barrel_pool")
    .select("remaining")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error || !data?.remaining?.length) return null;
  const idx = Math.floor(Math.random() * data.remaining.length);
  return data.remaining[idx] as number;
}

export async function confirmDraw(sessionId: string, barrel: number) {
  const supabase = createAdminClient();
  const { data: poolRow } = await supabase
    .from("barrel_pool")
    .select("remaining")
    .eq("session_id", sessionId)
    .single();
  if (!poolRow) throw new Error("Пул бочонков не инициализирован");

  const remaining = (poolRow.remaining as number[]).filter((b) => b !== barrel);
  if (remaining.length === poolRow.remaining.length) {
    throw new Error("Бочонок не найден в пуле");
  }

  const { count } = await supabase
    .from("draws")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);
  const sequence = (count ?? 0) + 1;

  const { error: drawErr } = await supabase.from("draws").insert({
    session_id: sessionId,
    sequence,
    barrel,
  });
  if (drawErr) throw new Error(drawErr.message);

  const { error: poolErr } = await supabase
    .from("barrel_pool")
    .update({ remaining })
    .eq("session_id", sessionId);
  if (poolErr) throw new Error(poolErr.message);

  return { sequence, barrel };
}