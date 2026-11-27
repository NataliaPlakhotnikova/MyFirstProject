import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionBySlug } from "@/lib/session-db";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  const supabaseAuth = await createClient();
  const { data: userData } = await supabaseAuth.auth.getUser();
  if (!userData.user?.email) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", session.id)
    .eq("email", userData.user.email.toLowerCase())
    .maybeSingle();

  if (!player) {
    return NextResponse.json({ player: null, session });
  }

  const { data: cards } = await supabase
    .from("player_cards")
    .select("*")
    .eq("player_id", player.id)
    .order("card_number");

  const cardIds = (cards ?? []).map((c) => c.id);
  const { data: marks } = cardIds.length
    ? await supabase.from("marks").select("*").in("player_card_id", cardIds)
    : { data: [] };

  const { data: score } = await supabase
    .from("scores")
    .select("points")
    .eq("player_id", player.id)
    .eq("session_id", session.id)
    .maybeSingle();

  const publicSession = { ...session };
  delete (publicSession as { host_token?: string }).host_token;
  return NextResponse.json({
    session: publicSession,
    player,
    cards: cards ?? [],
    marks: marks ?? [],
    points: score?.points ?? 0,
  });
}