-- 0035: 세션 종류를 인사이트 · 스터디 · 컨벤션으로 가른다
--
-- 43기까지는 비정규 세션을 종류별로 한 건에 몰아 담아 kind가 regular와
-- special 둘이면 충분했다. 44기부터 인사이트를 주차별로 쪼개 쌓기 때문에
-- special 하나에 인사이트 열몇 건과 스터디, 컨벤션이 뒤섞인다. 종류를
-- kind로 갈라 포털 홈에서 탭으로 나눈다. special은 아이디어톤이나 외부
-- 교육처럼 한 번만 열리는 나머지 회차 자리로 남긴다.
--
-- 실행 순서: 이 SQL을 먼저 돌리고 코드를 배포한다. 반대로 하면 임원진이
-- 새 유형을 고르는 순간 CHECK 위반으로 세션 저장이 실패한다. 반대 방향의
-- 위험(옛 코드 + 새 데이터)은 인사이트 회차가 잠시 정규 목록에 섞여 보이는
-- 정도라 무해하다.
--
-- 0034에서 실행 도구가 문장을 중간에서 잘라 두 번 실패했다. 한 문장은
-- 반드시 한 줄로 쓰고 do 블록을 쓰지 않는다. SQL Editor는 텍스트가
-- 선택돼 있으면 선택 영역만 실행하니 전체 선택을 풀고 돌린다.

alter table public.club_sessions drop constraint if exists club_sessions_kind_check;
alter table public.club_sessions add constraint club_sessions_kind_check check (kind in ('regular', 'insight', 'study', 'convention', 'special'));
update public.club_sessions set kind = 'insight' where kind = 'special' and title like '인사이트 세션%';
update public.club_sessions set kind = 'study' where kind = 'special' and title like '스터디 세션%';
update public.club_sessions set kind = 'convention' where kind = 'special' and title like '컨벤션 세션%';
