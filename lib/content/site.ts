// 기수·학기 라벨은 DB `site_config`가 단일 출처다 (lib/data/site-config.ts).
// 여기는 DB와 무관한 고정 정보만 남긴다.
export const SITE = {
  name: 'VERY',
  fullName: 'VERY · 연세대학교 창업학회',
  since: 1997,
  email: 'yonseivery1997@gmail.com',
  instagram: 'https://instagram.com/very_yonsei',
} as const

export const STATS = {
  yearsActive: new Date().getFullYear() - 1997,
  cohorts: 44,
  alumniCount: 500,
  startupsCount: 60,
} as const
