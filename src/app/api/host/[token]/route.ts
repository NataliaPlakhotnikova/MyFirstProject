import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHost } from "@/lib/api/host-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const session = await requireHost(token);
    const supabase = createAdminClient();

    const [playersRes, cardsRes, drawsRes, claimsRes] = await Promise.all([
      supabase
        .from("players")
        .select("id, email, nickname, created_at")
        .eq("session_id", session.id)
        .order("created_at"),
      supabase
        .from("player_cards")
        .select("id, player_id, card_number")
        .eq("session_id", session.id)
        .order("card_number"),
      supabase
        .from("draws")
        .select("*")
        .eq("session_id", session.id)
        .order("sequence"),
      supabase
        .from("claims")
        .select(
          "id, status, claimed_win_mode, created_at, player_cards(card_number, player_id)",
        )
        .eq("session_id", session.id)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      session,
      players: playersRes.data ?? [],
      cards: cardsRes.data ?? [],
      draws: drawsRes.data ?? [],
      claims: claimsRes.data ?? [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка";
    const status = msg.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}