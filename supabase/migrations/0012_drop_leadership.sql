-- supabase/migrations/0012_drop_leadership.sql
--
-- 0011에서 cohort_members로 회장·부회장·임원진·학회원을 통합 관리하기
-- 시작. 기존 leadership 테이블은 데이터가 cohort_members에 이미 존재
-- (신현우/구원근)하고, 애플리케이션 코드도 더 이상 참조하지 않으므로
-- 정리 차원에서 삭제.

drop table if exists public.leadership;
