import { NextResponse } from "next/server";
import { requireHost } from "@/lib/api/host-auth";
import { generateAllCards, updateSession } from "@/lib/session-db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const session = await requireHost(token);
    await updateSession(session.id, {
      registration_open: false,
      status: "playing",
    });
    await generateAllCards(session.id, session.cards_per_player);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}