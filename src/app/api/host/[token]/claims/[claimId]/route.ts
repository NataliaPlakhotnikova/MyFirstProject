import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireHost } from "@/lib/api/host-auth";
import { pointsForClaim, validateClaim } from "@/lib/loto/win-check";
import type { ClaimWinMode, LotoGrid, MarkerType, WinModes } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string; claimId: string }> },
) {
  const { token, claimId } = await params;
  try {
    const session = await requireHost(token);
    const body = (await req.json()) as {
      action: "accept" | "reject";
      rejectionReason?: string;
    };
    const supabase = createAdminClient();

    const { data: claim } = await supabase
      .from("claims")
      .select("*, player_cards(*)")
      .eq("id", claimId)
      .eq("session_id", session.id)
      .maybeSingle();
    if (!claim) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    const card = claim.player_cards as {
      id: string;
      grid: LotoGrid;
      card_number: number;
      player_id: string;
    };

    const { data: marksRows } = await supabase
      .from("marks")
      .select("row, col, marker_type")
      .eq("player_card_id", card.id);

    const marks = new Map<string, MarkerType>();
    for (const m of marksRows ?? []) {
      marks.set(`${m.row}:${m.col}`, m.marker_type as MarkerType);
    }

    const { data: draws } = await supabase
      .from("draws")
      .select("barrel")
      .eq("session_id", session.id);
    const drawn = (draws ?? []).map((d) => d.barrel as number);

    if (body.action === "accept") {
      const verdict = validateClaim(
        card.grid,
        marks,
        drawn,
        claim.claimed_win_mode as ClaimWinMode,
        session.win_modes as WinModes,
      );
      if (!verdict.ok) {
        return NextResponse.json(
          { error: verdict.reason ?? "Заявка не прошла проверку" },
          { status: 400 },
        );
      }
    }

    const status = body.action === "accept" ? "accepted" : "rejected";
    await supabase
      .from("claims")
      .update({
        status,
        host_validated_at: new Date().toISOString(),
        rejection_reason:
          body.action === "reject" ? body.rejectionReason ?? "Отклонено ведущим" : null,
      })
      .eq("id", claimId);

    if (body.action === "accept") {
      const points = pointsForClaim(claim.claimed_win_mode as ClaimWinMode);
      const { data: scoreRow } = await supabase
        .from("scores")
        .select("points")
        .eq("player_id", card.player_id)
        .eq("session_id", session.id)
        .maybeSingle();
      const newPoints = (scoreRow?.points ?? 0) + points;
      await supabase.from("scores").upsert({
        player_id: card.player_id,
        session_id: session.id,
        points: newPoints,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, cardNumber: card.card_number });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}