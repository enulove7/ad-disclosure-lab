-- AI 로 생성한 광고 이미지 후보. 광고 하나에 여러 후보를 만들어 두고 그중 하나를 채택한다.
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
alter table ad_images enable row level security;

-- 채택된 이미지의 생성 정보를 광고에도 남긴다 (논문 방법론 기술용)
alter table ads add column if not exists gen_prompt text not null default '';
alter table ads add column if not exists gen_model text not null default '';
