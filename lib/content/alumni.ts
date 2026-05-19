/**
 * /alumni page content.
 *
 * Society-side data is not yet wired (no Notion DB, no canonical alumni
 * roster). Spotlight cards are intentionally placeholder-shaped so the
 * layout reads as "coming soon" rather than fake. Pull from `STATS` so
 * the counters stay aligned with the home page's marquee.
 */
import { STATS } from './site'

export const ALUMNI = {
  hero: {
    eyebrow: 'Alumni — Vol.43 / 2026—1',
    headlineLine1: '졸업은 끝이 아니라,',
    headlineLine2: '다음 권의 시작.',
    subline:
      'Once VERY, always VERY. The roster doesn’t close at the end of a semester — it compounds.',
  },
  intro: {
    label: 'NETWORK',
    title: '한 학기 끝나도, 책장은 닫히지 않습니다.',
    body: 'VERY의 알럼나이 네트워크는 학기가 끝나도 이어지는 누적된 책장입니다. 매 권의 회원이 다음 권의 멘토·투자자·동료가 되는 구조로, 30년 가까이 그 두께를 쌓아왔습니다.',
  },
  stats: {
    label: 'BY THE NUMBERS',
    title: '쌓인 두께, 숫자로.',
    items: [
      {
        value: String(STATS.yearsActive),
        label: 'YEARS',
        note: '1997년부터 멈춘 적 없는 활동',
      },
      {
        value: String(STATS.cohorts),
        label: 'VOLUMES',
        note: '한 학기를 한 권으로',
      },
      {
        value: `${STATS.alumniCount}+`,
        label: 'ALUMNI',
        note: '누적 회원 네트워크',
      },
      {
        value: `${STATS.startupsCount}+`,
        label: 'STARTUPS',
        note: '학회를 거쳐간 창업팀',
      },
    ],
  },
  spotlight: {
    label: 'SPOTLIGHT',
    title: '책장 위에 꽂힌 회사들.',
    note: '정식 알럼나이 카탈로그는 노션 DB 연동 시 자동으로 갱신됩니다. 아래는 자리를 잡아둔 표지들입니다.',
    items: [
      {
        cohort: 'VOL.40',
        year: '2024',
        name: 'TBA',
        domain: 'B2B SaaS',
        note: '직전 학기 팀에서 출발해 외부 라운드로 이어진 회사. 정식 공개 전.',
      },
      {
        cohort: 'VOL.38',
        year: '2023',
        name: 'TBA',
        domain: 'Consumer · AI',
        note: '학회 데모데이 발표 → 후속 합류 → 시드 라운드 클로즈.',
      },
      {
        cohort: 'VOL.35',
        year: '2022',
        name: 'TBA',
        domain: 'Fintech',
        note: '재학 중 PMF 도달, 졸업 이후 시리즈 A 단계로 진입.',
      },
      {
        cohort: 'VOL.30',
        year: '2019',
        name: 'TBA',
        domain: 'Healthcare',
        note: '학회 동문 공동창업 케이스. 산학 파트너십을 통해 확장.',
      },
    ],
  },
  pathways: {
    label: 'PATHWAYS',
    title: '졸업 이후, 학회와의 거리.',
    items: [
      {
        mono: 'MENTORSHIP',
        title: '멘토링으로 돌아옵니다',
        body: '직전 학기를 마친 동문이 다음 권의 팀에 직접 피드백을 주는 자리. 학기 중 1:1, 학기 말 데모데이에서 자연스럽게 연결됩니다.',
      },
      {
        mono: 'FOLLOW-ON',
        title: '팀에 다시 합류하기도 합니다',
        body: '데모데이 무대에서 시작된 팀이 졸업 회원의 후속 합류로 본격 회사가 되는 사례. 학회는 이 다리를 직접 놓아줍니다.',
      },
      {
        mono: 'CAPITAL',
        title: '투자로 이어집니다',
        body: '동문 VC·엔젤이 학회 팀의 첫 미팅 상대가 되는 경우가 많습니다. 발표 → 후속 미팅 → 라운드까지의 거리가 가까운 편입니다.',
      },
    ],
  },
  closing: {
    label: 'JOIN',
    title: '다음 권에 이름을 올릴 사람을 찾고 있습니다.',
    body: '알럼나이 네트워크의 시작은 한 학기를 함께 끝내는 것입니다. 모집 시즌엔 노션·구글폼으로, 평소엔 메일·인스타로 연락 주세요.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
