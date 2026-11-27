import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionBySlug } from "@/lib/session-db";
import { createClient } from "@/lib/supabase/server";
import type { ClaimWinMode } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }
  if (session.status !== "playing") {
    return NextResponse.json({ error: "Игра ещё не началась" }, { status: 400 });
  }

  const supabaseAuth = await createClient();
  const { data: userData } = await supabaseAuth.auth.getUser();
  if (!userData.user?.email) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = (await req.json()) as {
    playerCardId: string;
    winMode: ClaimWinMode;
  };

  const supabase = createAdminClient();
  const { data: card } = await supabase
    .from("player_cards")
    .select("id, player_id")
    .eq("id", body.playerCardId)
    .eq("session_id", session.id)
    .maybeSingle();
  if (!card) {
    return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 });
  }

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("id", card.player_id)
    .eq("email", userData.user.email.toLowerCase())
    .maybeSingle();
  if (!player) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("claims")
    .insert({
      session_id: session.id,
      player_card_id: body.playerCardId,
      claimed_win_mode: body.winMode,
      status: "pending",
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claim: data });
}