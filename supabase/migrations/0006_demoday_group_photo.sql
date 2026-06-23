-- supabase/migrations/0006_demoday_group_photo.sql
--
-- 지난 회차(VOL.42 이전)의 단체사진을 마케팅 페이지 VolumesSection에서
-- 회차 row 아래에 노출하기 위한 컬럼. 어드민이 회차 상세에서 업로드한다.
-- 포스터와 동일한 demoday-posters bucket을 path prefix로 구분해 재사용.

alter table public.demoday_events
  add column if not exists group_photo_url text;

comment on column public.demoday_events.group_photo_url is
  '지난 회차의 단체사진(공개). NULL이면 미노출.';
