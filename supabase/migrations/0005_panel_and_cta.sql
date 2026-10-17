-- 패널 연동(외부 ID·유입 경로·쿼리 파라미터)과 광고 버튼 클릭 기록
alter table participants add column if not exists external_id text not null default '';
alter table participants add column if not exists source text not null default '';
alter table participants add column if not exists params jsonb not null default '{}'::jsonb;
create index if not exists participants_external_idx on participants(experiment_id, external_id);

alter table exposures add column if not exists cta_clicked_at timestamptz;
