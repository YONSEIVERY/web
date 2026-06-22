-- supabase/migrations/0005_demoday_event_end_date.sql
-- 데모데이 행사 종료 시각 컬럼. 시작 시각(event_date) + 종료 시각(event_end_date)
-- 두 개를 갖고 페이지에서 "14:00–18:00" 같은 범위 표기를 그릴 수 있게 한다.
-- NULL이면 종료 시각이 아직 미정 또는 표기 생략.

alter table public.demoday_events
  add column if not exists event_end_date timestamptz;

comment on column public.demoday_events.event_end_date is
  '행사 종료 시각. NULL이면 표기 생략.';
