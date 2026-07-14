-- supabase/migrations/0010_partners_marquee_logo.sql
--
-- 파트너 마퀴 배너용 별도 로고 URL 컬럼. 카드용 원본 로고(logo_url)와
-- 마퀴용 흑백 실루엣 SVG(marquee_logo_url)를 분리해 저장한다. null이면
-- 마퀴에 노출되지 않는다. 어드민에서 파트너를 관리하면 배너도 즉시
-- 반영됨(하드코딩 PARTNER_LOGOS 제거).

alter table public.partners
  add column if not exists marquee_logo_url text;

comment on column public.partners.marquee_logo_url is
  '마퀴 배너용 로고 URL. 다크 배경용 흑백 실루엣 SVG 권장. null이면 마퀴 미노출.';

-- 기존 하드코딩 마퀴 항목 7개 seed (name 매칭). 모두닥은 어드민에서
-- 이미 제외되어 시드하지 않음.
update public.partners set marquee_logo_url = '/partners/nocoders.svg'          where name = '노코더스';
update public.partners set marquee_logo_url = '/partners/toorder.svg'           where name = '티오더';
update public.partners set marquee_logo_url = '/partners/zuzu.svg'              where name = 'ZUZU';
update public.partners set marquee_logo_url = '/partners/alphabrothers.svg'     where name = '알파브라더스';
update public.partners set marquee_logo_url = '/partners/abmlab.svg'            where name = 'abmlab';
update public.partners set marquee_logo_url = '/partners/yonsei-engineering.svg' where name = '연세대 공과대학';
update public.partners set marquee_logo_url = '/partners/kvca.svg'              where name = '벤처캐피탈협회';
