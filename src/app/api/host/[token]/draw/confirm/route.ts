import { NextResponse } from "next/server";
import { requireHost } from "@/lib/api/host-auth";
import { confirmDraw } from "@/lib/session-db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const session = await requireHost(token);
    const { barrel } = (await req.json()) as { barrel: number };
    if (!barrel || barrel < 1 || barrel > 90) {
      return NextResponse.json({ error: "Некорректный бочонок" }, { status: 400 });
    }
    const draw = await confirmDraw(session.id, barrel);
    return NextResponse.json({ draw });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}