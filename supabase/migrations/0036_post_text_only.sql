-- 0036: 학회원 기록의 첨부 허용 여부
--
-- 인사이트 소감문처럼 글만 받는 회차에서 사진·파일 칸이 같이 떠 있으면
-- 학회원이 무엇을 내야 하는지 헷갈린다. 회차별로 첨부를 끌 수 있게 한다.
-- 기본값 true라 기존 회차(스터디 인증샷·녹음본, 컨벤션 인증)는 그대로다.
--
-- 실행 순서: 이 SQL을 먼저 실행한 뒤 코드(PR)를 머지한다.
-- 세션 저장이 이 컬럼에 쓰기 때문에 코드가 먼저 나가면 세션 편집이 실패한다.
-- 한 문장을 한 줄로 쓴다. SQL Editor는 텍스트를 선택해 두면 그 부분만 실행한다.

alter table public.club_sessions add column if not exists post_attachments boolean not null default true;

-- 이미 만들어진 인사이트 회차는 글만 받는 쪽으로 돌려 둔다.
update public.club_sessions set post_attachments = false where kind = 'insight';
