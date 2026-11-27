import { NextResponse } from "next/server";
import { requireHost } from "@/lib/api/host-auth";
import { pickRngCandidate } from "@/lib/session-db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const session = await requireHost(token);
    if (session.status !== "playing") {
      return NextResponse.json({ error: "Игра не идёт" }, { status: 400 });
    }
    const candidate = await pickRngCandidate(session.id);
    if (candidate == null) {
      return NextResponse.json({ error: "Бочонки закончились" }, { status: 400 });
    }
    return NextResponse.json({ candidate });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}