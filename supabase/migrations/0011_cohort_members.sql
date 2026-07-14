-- supabase/migrations/0011_cohort_members.sql
--
-- 학회원 명단. 회장·부회장·임원진·일반 학회원을 하나의 테이블로 관리한다.
-- 이전 leadership 테이블은 이 테이블의 role_tier in ('president','vice_president')
-- 조건으로 대체되며, 관련 어드민/공개 페이지도 여기를 참조하도록 리팩터.
--
-- 공개 노출 필드: name, role_label, college, major, status, bio, photo_url
-- 어드민 전용 필드(비공개): email, phone, student_id, birth  — RLS로 public 조회 시
-- 자동 감춰지진 않고(select *로 노출됨), lib에서 select 시 명시적으로 뺀다.

create table if not exists public.cohort_members (
  id uuid primary key default uuid_generate_v4(),
  cohort int not null,
  name text not null,
  mono_name text,
  role_tier text not null check (role_tier in ('president','vice_president','officer','member')),
  role_label text,
  team text,
  college text,
  major text,
  status text,
  bio text,
  photo_url text,
  -- 관리용 (비공개 · lib/cohort-members/queries.ts에서 public 조회 시 제외)
  email text,
  phone text,
  student_id text,
  birth text,
  --
  published boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cohort_members_lookup_idx
  on public.cohort_members (cohort, published, role_tier, sort_order);

alter table public.cohort_members enable row level security;

-- 공개 SELECT은 published=true 만. mutation은 service_role 전용(정책 없음).
drop policy if exists "cohort_members public read" on public.cohort_members;
create policy "cohort_members public read" on public.cohort_members
  for select using (published = true);

-- Storage bucket for member photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cohort-member-photos', 'cohort-member-photos', true, 5242880,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: public read
drop policy if exists "cohort_member_photos public read" on storage.objects;
create policy "cohort_member_photos public read"
  on storage.objects for select using (bucket_id = 'cohort-member-photos');

-- 43기 27명 시드
insert into public.cohort_members
  (name, role_label, role_tier, cohort, college, major, status, student_id, birth, phone, email, sort_order, published)
values
  ('신현우', '학회장', 'president', 43, '공과대학', '전기전자공학부', '휴학', '2022142116', '20129', '010-8283-3973', 'ricky7@yonsei.ac.kr', 10, true),
  ('구원근', '부회장', 'vice_president', 43, '공과대학', '기계공학과', '휴학', '2021145052', '20208', '010-7334-3125', '91kwk0208@gmail.com', 20, true),
  ('김규민', '운영부장', 'officer', 43, '언더우드국제대학', '융합인문사회과학부', '재학', '2025195012', '41226', '010-4388-4983', 'kgm4983@gmail.com', 30, true),
  ('김가연', '기획부장/총무', 'officer', 43, '문과대학', '독어독문학과', '재학', '2024113019', '50720', '010-8302-0848', 'kayeon0720@gmail.com', 40, true),
  ('조윤서', '디자이너', 'officer', 43, '생활과학대학', '통합디자인학과', '재학', '2024', '50000', '010-3709-2448', 'yuunseocho@gmail.com', 50, true),
  ('황혜빈', '상임고문', 'officer', 43, '공과대학', '산업공학과', '휴학', '2023147011', '30316', '010-7405-9870', 'hyxb2n@yonsei.ac.kr', 60, true),
  ('강다영', '학회원', 'member', 43, '사회과학대학', '행정학과', '재학', '2024126024', '40831', '010-2563-9972', 'qwert1mn@naver.com', 100, true),
  ('고민서', '학회원', 'member', 43, '경영대학', '경영학과', '재학', '2023123191', '21219', '010-7709-9779', 'ms90@yonsei.ac.kr', 110, true),
  ('금서영', '학회원', 'member', 43, '언더우드국제대학', '융합과학공학부', '재학', '2026199084', '70417', '010-2113-1479', 'eva070417@gmail.com', 120, true),
  ('김슬찬', '학회원', 'member', 43, '공과대학', '전기전자공학부', '재학', '2020142225', '1031', '010-2932-9745', 'godslchan@gmail.com', 130, true),
  ('김지민', '학회원', 'member', 43, '사회과학대학', '언론홍보영상학부', '재학', '2024129059', '51203', '010-5005-2181', 'damien24@yonsei.ac.kr', 140, true),
  ('김태환', '학회원', 'member', 43, '상경대학', '경제학과', '재학', '2025121080', '61215', '010-3921-0474', 'run01175@gmail.com', 150, true),
  ('성지원', '학회원', 'member', 43, '공과대학', '화공생명공학부', '재학', '2021141069', '20510', '010-7353-6514', 'jiwonsung_21@yonsei.ac.kr', 160, true),
  ('손승현', '학회원', 'member', 43, '경영대학', '경영학과', '재학', '2023123412', '20125', '010-5607-8281', 'danielsh0125@naver.com', 170, true),
  ('시종하', '학회원', 'member', 43, '공과대학', '신소재공학과', '재학', '2021146029', '10727', '010-3957-9727', 'jongha0727@yonsei.ac.kr', 180, true),
  ('양승혁', '학회원', 'member', 43, '공과대학', '전기전자공학부', '재학', '2025142160', '40120', '010-7665-9173', 'suhelyang@naver.com', 190, true),
  ('연승민', '학회원', 'member', 43, '상경대학', '응용통계학과', '재학', '2025122022', '61129', '010-5526-0384', 'miles0384@gmail.com', 200, true),
  ('윤석민', '학회원', 'member', 43, '공과대학', '건설환경공학과', '휴학', '2022144089', '20322', '010-4536-5354', 'why0322@yonsei.ac.kr', 210, true),
  ('이경은', '학회원', 'member', 43, '생활과학대학', '아동가족학과', '재학', '2025154010', '60923', '010-4059-6349', 'lku0923@naver.com', 220, true),
  ('이범규', '학회원', 'member', 43, '경영대학', '경영학과', '재학', '2024123067', '30917', '010-5623-2621', 'dinor6464@gmail.com', 230, true),
  ('이언주', '학회원', 'member', 43, '언더우드국제대학', '언더우드학부 경제학과', '휴학', '2022190131', '30716', '010-4164-8662', 'eonzuzu@yonsei.ac.kr', 240, true),
  ('임서현', '학회원', 'member', 43, '언더우드국제대학', '창의기술경영', '재학', '2023195069', '41218', '010-2031-5234', 'seo1218hyun@yonsei.ac.kr', 250, true),
  ('임채강', '학회원', 'member', 43, '사회과학대학', '사회학과', '휴학', '2023127050', '30608', '010-2417-7204', 'cheakang68@naver.com', 260, true),
  ('조서희', '학회원', 'member', 43, '언더우드국제대학', '언더우드학부 경제학과', '재학', '2025190111', '60610', '010-6257-0001', 'choseohee111@yonsei.ac.kr', 270, true),
  ('지강은', '학회원', 'member', 43, '교육과학대학', '스포츠응용산업학과', '재학', '2023181050', '10107', '010-8932-7264', 'kiro5812@naver.com', 280, true),
  ('한다현', '학회원', 'member', 43, '공과대학', '도시공학과', '재학', '2022143509', '31114', '010-5129-7648', 'cityboy@yonsei.ac.kr', 290, true),
  ('황진하', '학회원', 'member', 43, '생명시스템대학', '생화학과', '재학', '2021162037', '20710', '010-7788-8539', 'hwangjinha@yonsei.ac.kr', 300, true);
