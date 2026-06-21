/**
 * /alumni page content.
 *
 * Brand metaphor (per VERY BI doc): the alumni network is a layered
 * ground — each cohort hands the next a more compacted layer to land on.
 * Magazine vocabulary (책장 / 표지 / 한 권) is reserved for masthead-style
 * markers (VOL.43 etc.); body copy uses 지반 / 기수 / 누적.
 *
 * Canonical alumni roster is managed in the Supabase admin DB; entries
 * appear here after the operator approves them. Spotlight cards below
 * are intentionally placeholder-shaped so the layout reads as "coming
 * soon" rather than fake. Pull from `STATS` so the counters stay aligned
 * with the home page's marquee.
 */
import { STATS } from './site'

export const ALUMNI = {
  hero: {
    eyebrow: 'Alumni — Vol.43 / 2026—1',
    headlineLine1: '졸업은 끝이 아니라,',
    headlineLine2: '다음 지반의 시작.',
    subline:
      '학회를 거친 사람은 학기와 함께 사라지지 않습니다. 매 기수가 더 단단해진 지반으로 누적됩니다.',
  },
  intro: {
    label: 'NETWORK',
    title: '학기로 끝나지 않는 네트워크.',
    body: '학기가 끝나도 네트워크의 문은 닫히지 않습니다. 선배 기수가 후배 팀의 멘토와 투자자, 동료로 다시 돌아와 30년 가까운 시간 동안 그 두께를 더해 왔습니다.',
  },
  stats: {
    label: 'BY THE NUMBERS',
    title: '다져진 지반, 숫자로.',
    items: [
      {
        value: String(STATS.yearsActive),
        label: 'YEARS',
        note: '1997년부터 멈춘 적 없는 활동',
      },
      {
        value: String(STATS.cohorts),
        label: 'COHORTS',
        note: '누적된 기수의 수',
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
    title: '지반 위에 선 회사들.',
    note: '정식 알럼나이 명단은 운영진 검토를 거쳐 순차적으로 공개됩니다. 아래는 그 자리를 미리 마련해 둔 카드입니다.',
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
        body: '직전 학기를 마친 동문이 다음 기수의 팀에 직접 피드백을 주는 자리. 학기 중 1:1, 학기 말 데모데이에서 자연스럽게 연결됩니다.',
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
    title: '다음 기수에 합류할 사람을 찾고 있습니다.',
    body: '메일이나 인스타그램으로 가볍게 연락 주세요. 시즌 일정은 인스타에 가장 먼저 올라갑니다.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
