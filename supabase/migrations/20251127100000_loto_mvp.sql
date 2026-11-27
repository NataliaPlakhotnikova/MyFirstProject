-- Лото онлайн MVP schema

create extension if not exists "pgcrypto";

create type session_status as enum ('draft', 'registration', 'playing', 'finished');
create type claim_status as enum ('pending', 'accepted', 'rejected');
create type marker_type as enum ('star', 'circle', 'diamond', 'heart', 'oval', 'logo');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  host_token uuid not null default gen_random_uuid() unique,
  slug text not null unique,
  status session_status not null default 'draft',
  cards_per_player int not null default 2 check (cards_per_player between 1 and 6),
  win_modes jsonb not null default '{"one_line": true, "two_lines": false, "full_card": false}'::jsonb,
  registration_open boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  email text not null,
  nickname text,
  auth_user_id uuid,
  consent_pd_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, email)
);

create table public.player_cards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  card_number int not null,
  grid jsonb not null,
  unique (session_id, card_number)
);

create table public.marks (
  player_card_id uuid not null references public.player_cards(id) on delete cascade,
  row smallint not null check (row between 0 and 2),
  col smallint not null check (col between 0 and 8),
  marker_type marker_type not null default 'star',
  marked_at timestamptz not null default now(),
  primary key (player_card_id, row, col)
);

create table public.barrel_pool (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  remaining int[] not null
);

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  sequence int not null,
  barrel int not null check (barrel between 1 and 90),
  confirmed_at timestamptz not null default now(),
  unique (session_id, sequence),
  unique (session_id, barrel)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  player_card_id uuid not null references public.player_cards(id) on delete cascade,
  claimed_win_mode text not null check (claimed_win_mode in ('one_line', 'two_lines', 'full_card')),
  status claim_status not null default 'pending',
  host_validated_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table public.scores (
  player_id uuid not null references public.players(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  points int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (player_id, session_id)
);

create index idx_players_session on public.players(session_id);
create index idx_cards_session on public.player_cards(session_id);
create index idx_draws_session on public.draws(session_id, sequence);
create index idx_claims_session on public.claims(session_id, status);

alter table public.sessions enable row level security;
alter table public.players enable row level security;
alter table public.player_cards enable row level security;
alter table public.marks enable row level security;
alter table public.barrel_pool enable row level security;
alter table public.draws enable row level security;
alter table public.claims enable row level security;
alter table public.scores enable row level security;

-- Public read of active session by slug (no secrets)
create policy sessions_public_read on public.sessions
  for select using (true);

create policy draws_public_read on public.draws
  for select using (true);

-- Service role bypasses RLS; player policies added in phase 2 if needed.

alter publication supabase_realtime add table public.draws;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.claims;