import { NextResponse } from "next/server";
import { requireHost } from "@/lib/api/host-auth";
import { updateSession } from "@/lib/session-db";
import type { WinModes } from "@/lib/types";
import { PILOT_MAX_CARDS_PER_PLAYER } from "@/lib/loto/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const session = await requireHost(token);
    const body = (await req.json()) as {
      cardsPerPlayer?: number;
      registrationOpen?: boolean;
      status?: typeof session.status;
      winModes?: WinModes;
    };

    const patch: Parameters<typeof updateSession>[1] = {};
    if (typeof body.registrationOpen === "boolean") {
      patch.registration_open = body.registrationOpen;
      if (body.registrationOpen && session.status === "draft") {
        patch.status = "registration";
      }
    }
    if (body.cardsPerPlayer != null) {
      patch.cards_per_player = Math.min(
        Math.max(1, body.cardsPerPlayer),
        PILOT_MAX_CARDS_PER_PLAYER,
      );
    }
    if (body.winModes) patch.win_modes = body.winModes;
    if (body.status) patch.status = body.status;

    await updateSession(session.id, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}