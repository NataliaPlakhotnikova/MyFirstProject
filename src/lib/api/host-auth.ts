import { getSessionByHostToken } from "@/lib/session-db";
import type { Session } from "@/lib/types";

export async function requireHost(token: string | null): Promise<Session> {
  if (!token) throw new Error("Host token required");
  const session = await getSessionByHostToken(token);
  if (!session) throw new Error("Session not found");
  return session;
}

export function hostTokenFromRequest(req: Request): string | null {
  const header = req.headers.get("x-host-token");
  if (header) return header;
  try {
    const url = new URL(req.url);
    return url.searchParams.get("host_token");
  } catch {
    return null;
  }
}