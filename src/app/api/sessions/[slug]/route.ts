import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionBySlug } from "@/lib/session-db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { data: draws } = await supabase
    .from("draws")
    .select("*")
    .eq("session_id", session.id)
    .order("sequence", { ascending: true });

  const { host_token: _hidden, ...publicSession } = session;
  return NextResponse.json({ session: publicSession, draws: draws ?? [] });
}