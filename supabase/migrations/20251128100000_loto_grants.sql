-- GRANTs for Supabase API roles (fixes "permission denied for table sessions" on INSERT via service_role).
-- The MVP schema migration enabled RLS but did not grant table privileges to anon/authenticated/service_role.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant usage on type public.session_status to anon, authenticated, service_role;
grant usage on type public.claim_status to anon, authenticated, service_role;
grant usage on type public.marker_type to anon, authenticated, service_role;

grant all on table public.sessions to postgres, service_role;
grant all on table public.players to postgres, service_role;
grant all on table public.player_cards to postgres, service_role;
grant all on table public.marks to postgres, service_role;
grant all on table public.barrel_pool to postgres, service_role;
grant all on table public.draws to postgres, service_role;
grant all on table public.claims to postgres, service_role;
grant all on table public.scores to postgres, service_role;

-- Authenticated players (OTP) + public read paths via PostgREST
grant select, insert, update, delete on table public.sessions to authenticated;
grant select, insert, update, delete on table public.players to authenticated;
grant select, insert, update, delete on table public.player_cards to authenticated;
grant select, insert, update, delete on table public.marks to authenticated;
grant select, insert, update, delete on table public.barrel_pool to authenticated;
grant select, insert, update, delete on table public.draws to authenticated;
grant select, insert, update, delete on table public.claims to authenticated;
grant select, insert, update, delete on table public.scores to authenticated;

grant select on table public.sessions to anon;
grant select on table public.draws to anon;

-- Future tables in this project (local / linked Supabase CLI)
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;