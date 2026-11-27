import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionBySlug } from "@/lib/session-db";
import { createClient } from "@/lib/supabase/server";
import type { MarkerType } from "@/lib/types";

export async function PUT(
  req: Request,
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

  const body = (await req.json()) as {
    playerCardId: string;
    row: number;
    col: number;
    markerType: MarkerType;
    remove?: boolean;
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

  if (body.remove) {
    await supabase
      .from("marks")
      .delete()
      .eq("player_card_id", body.playerCardId)
      .eq("row", body.row)
      .eq("col", body.col);
  } else {
    await supabase.from("marks").upsert({
      player_card_id: body.playerCardId,
      row: body.row,
      col: body.col,
      marker_type: body.markerType,
      marked_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}