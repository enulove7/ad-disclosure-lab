-- 「AI일까 사람일까」 스와이프 게임
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  intro_text text not null default '',
  status text not null default 'draft' check (status in ('draft','active','closed')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists game_cards (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  brand_name text not null default '',
  headline text not null default '',
  body_text text not null default '',
  image_url text not null default '',
  is_ai boolean not null default true,
  source_note text not null default '',
  gen_prompt text not null default '',
  gen_model text not null default '',
  sort_order integer not null default 0
);
create index if not exists game_cards_game_idx on game_cards(game_id);

create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  token text not null unique,
  card_ids jsonb not null default '[]'::jsonb,
  user_agent text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer not null default 0,
  total integer not null default 0
);
create index if not exists game_sessions_game_idx on game_sessions(game_id);

create table if not exists game_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  card_id uuid not null references game_cards(id) on delete cascade,
  sort_order integer not null default 0,
  guess_ai boolean not null,
  correct boolean not null,
  liking_before integer,
  liking_after integer,
  response_ms integer,
  answered_at timestamptz not null default now()
);
create index if not exists game_answers_session_idx on game_answers(session_id);

alter table games enable row level security;
alter table game_cards enable row level security;
alter table game_sessions enable row level security;
alter table game_answers enable row level security;
