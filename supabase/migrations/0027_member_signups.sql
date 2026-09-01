-- ============================================================
-- 0027: 학회원 자율 등록 신청 (member_signups)
--
-- 배경
--   포털은 cohort_members.email로 사람을 알아본다. 이메일이 곧 로그인
--   자격이다. 그런데 지원서에 적은 주소와 실제 구글 로그인 계정이 다른
--   사람이 있다. 합격자 일괄 등록만으로는 그들이 포털에 못 들어간다.
--
--   그래서 공개 폼으로 본인이 직접 주소를 신청하는 경로를 둔다. 다만
--   공개 폼에는 로그인 게이트가 없으므로, 신청은 누구나 넣을 수 있고
--   사람(어드민)이 승인해야 cohort_members로 옮겨 간다. 이 테이블은
--   그 대기열이다.
--
-- 보안 등급
--   이름·이메일·전화번호·학번이 한 행에 모인다. applications, cohort_members와
--   같은 등급의 개인정보 테이블이다. 2026-08-04 점검에서 익명 REST로
--   cohort_members의 비공개 컬럼이 실제로 조회된 사고가 있었고 0018에서
--   닫았다. 같은 실수를 반복하지 않도록 처음부터 정책 0개로 만든다.
--   읽기·쓰기는 전부 서버 액션의 service_role만 수행한다.
--
-- 의존
--   0026의 public.log_row_delete()·public.block_truncate()를 재사용한다.
--   0026이 먼저 적용돼 있어야 한다. 0026 파일은 건드리지 않고 여기서 붙인다.
--
-- 전체가 멱등(idempotent)이라 SQL 에디터에서 재실행해도 안전하다.
-- ============================================================

create table if not exists public.member_signups (
  id uuid primary key default uuid_generate_v4(),
  cohort int not null,
  name text not null,
  email text not null,
  phone text,
  student_id text,
  college text,
  major text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  -- 신청자가 남기는 한 줄 (선택). 지원서 이메일과 다른 이유 등을 적는 칸.
  note text,
  -- 승인·반려 처리 기록. 승인 시점에 어드민 이메일이 들어간다.
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now()
);

-- 기수당 이메일 1회 신청 (대소문자 무시). applications_round_email_uniq와
-- 같은 관행이다. 저장소 전체가 이메일을 lower로 비교하므로(0014·0022·0023)
-- 유니크도 lower 기준이어야 Aaa@x.com과 aaa@x.com이 둘 다 들어오지 않는다.
-- 중복 신청은 23505로 막힌다. 호출부에서 사람이 읽을 문장으로 옮길 것.
--
-- 반려(rejected)된 행도 이 인덱스에 남는다. 즉 같은 주소로는 다시 신청할 수
-- 없다. 사칭 신청을 반려한 뒤 같은 주소로 재시도하는 경로를 막기 위해
-- 의도한 것이다. 반려가 오판이었다면 어드민이 학회원 등록 화면에서 직접
-- 추가하면 되므로 막다른 길은 아니다.
create unique index if not exists member_signups_cohort_email_uniq
  on public.member_signups (cohort, lower(email));

-- 어드민 대기 목록 조회용. 기수 + 상태로 걸러 최신순으로 본다.
create index if not exists member_signups_pending_idx
  on public.member_signups (cohort, status, created_at desc);

-- ============================================================
-- RLS: 정책 0개 = anon·authenticated 전면 차단
-- ============================================================
alter table public.member_signups enable row level security;

-- Supabase는 public 스키마에 default privileges가 걸려 있어 새 테이블에
-- anon·authenticated 권한이 자동으로 붙는다. RLS만 켜고 끝내지 않는다.
revoke all on public.member_signups from anon, authenticated;

-- 정책은 만들지 않는다. service_role은 RLS를 우회하므로 서버 액션만 통한다.

-- ============================================================
-- 감사·TRUNCATE 차단 (0026의 설치 방식을 그대로 적용)
-- ============================================================
drop trigger if exists audit_delete on public.member_signups;
create trigger audit_delete
  after delete on public.member_signups
  for each row execute function public.log_row_delete();

drop trigger if exists no_truncate on public.member_signups;
create trigger no_truncate
  before truncate on public.member_signups
  for each statement execute function public.block_truncate();

select 'MEMBER_SIGNUPS_INSTALLED' as result,
  (select count(*) from pg_policies where tablename = 'member_signups') as policies,
  (select count(*) from pg_trigger t
     join pg_class c on c.oid = t.tgrelid
    where c.relname = 'member_signups'
      and not t.tgisinternal
      and t.tgname in ('audit_delete','no_truncate')) as guards;
