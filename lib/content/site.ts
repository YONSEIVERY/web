export const SITE = {
  name: 'VERY',
  fullName: 'VERY ─ 연세대학교 창업학회',
  since: 1997,
  currentCohort: 43,
  email: 'yonseivery1997@gmail.com',
  instagram: 'https://instagram.com/very_yonsei',
  recruitFormUrl: process.env.RECRUIT_FORM_URL ?? '#',
} as const

export const STATS = {
  yearsActive: new Date().getFullYear() - 1997,
  cohorts: 43,
  alumniCount: 500,
  startupsCount: 60,
} as const
