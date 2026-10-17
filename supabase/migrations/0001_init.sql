-- AI 광고 공개 실험 플랫폼 스키마 v1
-- 모든 접근은 서버(service role)에서만 이루어지므로 RLS로 anon 접근을 전면 차단한다.

create extension if not exists "pgcrypto";

create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','active','closed')),
  consent_text text not null default '',
  debrief_text text not null default '',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists conditions (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  code text not null,
  name text not null,
  label_config jsonb not null default '{}'::jsonb,
  weight integer not null default 1,
  sort_order integer not null default 0,
  unique (experiment_id, code)
);

create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  code text not null,
  name text not null,
  brand_name text not null default '',
  product_category text not null default '',
  headline text not null default '',
  body_text text not null default '',
  cta_text text not null default '',
  image_url text not null default '',
  gen_prompt text not null default '',
  gen_model text not null default '',
  sort_order integer not null default 0,
  unique (experiment_id, code)
);

-- AI 로 생성한 광고 이미지 후보
create table if not exists ad_images (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  ad_id uuid not null references ads(id) on delete cascade,
  image_url text not null,
  prompt text not null default '',
  model text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ad_images_ad_idx on ad_images(ad_id);

create table if not exists survey_items (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  phase text not null check (phase in ('pre','post_ad','final')),
  code text not null,
  construct text not null default '',
  text text not null,
  type text not null check (type in ('likert','single','multi','number','text')),
  scale_points integer not null default 7,
  scale_labels jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  sort_order integer not null default 0,
  unique (experiment_id, code)
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  token text not null unique,
  status text not null default 'started'
    check (status in ('started','pre_done','ads_done','completed','dropped')),
  user_agent text not null default '',
  external_id text not null default '',
  source text not null default '',
  params jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists participants_experiment_idx on participants(experiment_id);
create index if not exists participants_external_idx on participants(experiment_id, external_id);

create table if not exists exposures (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  ad_id uuid not null references ads(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  sort_order integer not null default 0,
  label_snapshot jsonb not null default '{}'::jsonb,
  shown_at timestamptz,
  duration_ms integer,
  cta_clicked_at timestamptz
);
create index if not exists exposures_participant_idx on exposures(participant_id);

create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  exposure_id uuid references exposures(id) on delete cascade,
  item_id uuid not null references survey_items(id) on delete cascade,
  phase text not null check (phase in ('pre','post_ad','final')),
  value jsonb,
  answered_at timestamptz not null default now()
);
create index if not exists responses_participant_idx on responses(participant_id);

-- anon/authenticated 키로는 아무 것도 읽고 쓸 수 없게 한다 (service role만 사용)
alter table experiments enable row level security;
alter table conditions enable row level security;
alter table ads enable row level security;
alter table survey_items enable row level security;
alter table ad_images enable row level security;
alter table participants enable row level security;
alter table exposures enable row level security;
alter table responses enable row level security;

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

-- 광고 이미지 저장용 공개 버킷
insert into storage.buckets (id, name, public)
values ('ad-images', 'ad-images', true)
on conflict (id) do nothing;
