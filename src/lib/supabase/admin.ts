import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY и NEXT_PUBLIC_SUPABASE_URL обязательны на сервере",
    );
  }
  if (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
    key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY совпадает с anon/publishable ключом — укажите Secret key из Supabase",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}