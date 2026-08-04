-- supabase/migrations/0019_admins_44th.sql
--
-- 44기 임원진 어드민 화이트리스트 (학회장 지정, 2026-08-04).
-- admins 등록 = /admin 전체 권한(지원자 PII 열람 포함) + 포털 exec.
-- 이메일은 43기 명단(0011 시드) 기준. 구글 로그인이 되는 주소여야 하며,
-- 로그인 실패 시 본인의 구글 계정 주소로 email을 교체할 것.
-- 신현우(ricky7@yonsei.ac.kr)는 학회장 결정으로 유지 (2026-08-04).
-- 지강은은 연세 메일로 교체, 강다영은 제외 (학회장 지시, 2026-08-04).

delete from public.admins
  where email in ('qwert1mn@naver.com', 'kiro5812@naver.com');

insert into public.admins (email, name) values
  ('ms90@yonsei.ac.kr', '고민서'),
  ('91kwk0208@gmail.com', '구원근'),
  ('seo1218hyun@yonsei.ac.kr', '임서현'),
  ('run01175@gmail.com', '김태환'),
  ('cityboy@yonsei.ac.kr', '한다현'),
  ('kiro5812@yonsei.ac.kr', '지강은'),
  ('miles0384@gmail.com', '연승민')
on conflict (email) do nothing;
