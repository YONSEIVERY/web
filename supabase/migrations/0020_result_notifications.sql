-- supabase/migrations/0020_result_notifications.sql
--
-- 지원 결과(서류·최종) 통보 메일의 발송 기록. 어드민의 "결과 발송" 버튼이
-- 미발송(null) 행만 골라 보내고 성공 시 시각을 찍는다. 같은 단계를 두 번
-- 눌러도 이미 발송된 지원자에게는 다시 가지 않는 멱등 장치.

alter table public.applications
  add column if not exists docs_result_sent_at timestamptz,
  add column if not exists final_result_sent_at timestamptz;
