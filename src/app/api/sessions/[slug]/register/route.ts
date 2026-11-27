import { NextResponse } from "next/server";
import { getSessionBySlug, registerPlayer } from "@/lib/session-db";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }
  if (!session.registration_open) {
    return NextResponse.json({ error: "Регистрация закрыта" }, { status: 400 });
  }

  const body = (await req.json()) as {
    nickname?: string;
    consent: boolean;
  };
  if (!body.consent) {
    return NextResponse.json(
      { error: "Нужно согласие на обработку email" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user?.email) {
    return NextResponse.json({ error: "Войдите по email (OTP)" }, { status: 401 });
  }

  try {
    const player = await registerPlayer({
      sessionId: session.id,
      email: userData.user.email,
      nickname: body.nickname,
      authUserId: userData.user.id,
      consentAt: new Date().toISOString(),
    });
    return NextResponse.json({ player });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка регистрации";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}