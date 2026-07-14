-- supabase/migrations/0009_demoday_afterparty_toggle.sql
--
-- 데모데이 회차별로 "뒷풀이 참석 여부" 필드를 신청 폼에서 노출할지
-- 어드민이 토글할 수 있도록 flag 컬럼 추가. 기본값 true 로 두어 기존
-- 회차의 노출 동작을 그대로 유지한다.

alter table public.demoday_events
  add column if not exists afterparty_field_enabled boolean not null default true;

comment on column public.demoday_events.afterparty_field_enabled is
  '공개 신청 폼에서 "뒷풀이 참석 여부" RadioGroup 노출 여부. false 면 폼에서 필드 자체를 감춘다.';
