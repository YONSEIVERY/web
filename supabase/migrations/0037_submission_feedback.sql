-- ============================================================
-- 0037: 발표자료 피드백 (submission_feedback)
--
-- 학회장단이 데모데이처럼 팀이 매주 내는 발표자료마다 피드백을 적는다.
-- 팀 테이블이 없고 team_label은 비어 있거나 표기가 제각각이라(2026-11-26
-- 데모데이 3회차 확인), 피드백은 팀 이름이 아니라 제출물 한 건에 붙인다.
-- 데모데이는 팀마다 한 건씩 내므로 제출물 = 팀이다.
--
-- 가시성은 제출물을 그대로 따른다(화면 쪽 session-submissions.tsx).
-- 그 발표자료를 볼 수 있는 사람만 피드백을 본다: 임원진, 낸 본인,
-- submissions_visible이 켜진 회차의 학회원.
--
-- 쓰기와 삭제는 lead(학회장단)만. 서버 액션이 requireLead로 확인한다.
--
-- submission_id는 cascade다. 팀이 다시 내면서 옛 제출물을 지우면 그
-- 제출물의 피드백도 같이 지워지고, 0026 감사 트리거가 지워진 행을
-- 원본째 audit_log에 기록하므로 복구 근거는 유지된다.
--
-- 보안 등급: 학회원 결과물에 대한 평 + 이메일. 0031과 같이 정책 0개
-- (= service_role 전용).
--
-- 실행 순서: 이 SQL을 먼저 실행한 뒤 코드(PR)를 머지한다. 코드가 먼저
-- 나가도 세션 화면은 깨지지 않고(조회 실패는 빈 목록) 작성만 실패한다.
-- 의존: 0026의 public.log_row_delete()·public.block_truncate().
-- 전체 멱등. 핸드북 규칙대로 한 문장을 한 줄로 쓴다.
-- ============================================================

create table if not exists public.submission_feedback (id uuid primary key default uuid_generate_v4(), submission_id uuid not null references public.session_submissions(id) on delete cascade, author_email text not null, author_name text not null, body text not null, created_at timestamptz not null default now());

create index if not exists submission_feedback_submission_idx on public.submission_feedback (submission_id, created_at);

-- RLS: 정책 0개 = anon·authenticated 전면 차단, 서버(service_role)만
alter table public.submission_feedback enable row level security;
revoke all on public.submission_feedback from anon, authenticated;
grant select, insert, update, delete on public.submission_feedback to service_role;

-- 감사·TRUNCATE 차단 (0026의 설치 방식을 그대로 적용)
drop trigger if exists audit_delete on public.submission_feedback;
create trigger audit_delete after delete on public.submission_feedback for each row execute function public.log_row_delete();
drop trigger if exists no_truncate on public.submission_feedback;
create trigger no_truncate before truncate on public.submission_feedback for each statement execute function public.block_truncate();

-- 기대값: SUBMISSION_FEEDBACK_INSTALLED, policies 0, guards 2
select 'SUBMISSION_FEEDBACK_INSTALLED' as result, (select count(*) from pg_policies where tablename = 'submission_feedback') as policies, (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid where c.relname = 'submission_feedback' and not t.tgisinternal and t.tgname in ('audit_delete','no_truncate')) as guards;
