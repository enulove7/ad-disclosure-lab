-- 실험/조건/광고/문항을 삭제할 때 노출·응답도 함께 지워지도록 외래키에 cascade 를 건다.
-- (0001 에서는 cascade 가 없어, 데이터가 있는 실험을 삭제하면 FK 오류가 났다)

alter table exposures drop constraint if exists exposures_condition_id_fkey;
alter table exposures add constraint exposures_condition_id_fkey
  foreign key (condition_id) references conditions(id) on delete cascade;

alter table exposures drop constraint if exists exposures_ad_id_fkey;
alter table exposures add constraint exposures_ad_id_fkey
  foreign key (ad_id) references ads(id) on delete cascade;

alter table participants drop constraint if exists participants_condition_id_fkey;
alter table participants add constraint participants_condition_id_fkey
  foreign key (condition_id) references conditions(id) on delete cascade;

alter table responses drop constraint if exists responses_item_id_fkey;
alter table responses add constraint responses_item_id_fkey
  foreign key (item_id) references survey_items(id) on delete cascade;
