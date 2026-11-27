import { NextResponse } from "next/server";
import { createSession } from "@/lib/session-db";
import { PILOT_MAX_CARDS_PER_PLAYER } from "@/lib/loto/constants";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      cardsPerPlayer?: number;
    };
    const raw = body.cardsPerPlayer ?? PILOT_MAX_CARDS_PER_PLAYER;
    const cardsPerPlayer = Math.min(Math.max(1, raw), PILOT_MAX_CARDS_PER_PLAYER);

    const session = await createSession(cardsPerPlayer);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.json({
      session,
      playUrl: `${base}/play/${session.slug}`,
      hostUrl: `${base}/host/${session.host_token}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка создания сессии";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}