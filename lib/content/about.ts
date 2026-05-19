/**
 * /about page content.
 *
 * Seven blocks: Hero, Origin, Core Value, Mindset, What We Do, Leadership,
 * Closing. Core Value(KNOWLEDGE/EXPERIENCE/NETWORK) and Mindset(인재상) are
 * lifted verbatim from VERY_43기_OT.pdf p.5–6 — do not paraphrase. The OT
 * deck is what every recruit reads first, so the on-site copy must match.
 */
export const ABOUT = {
  hero: {
    eyebrow: 'About — Vol.43 / 2026—1',
    headlineLine1: '졸업하지 않는다.',
    headlineLine2: '누적될 뿐이다.',
    subline:
      'We don’t graduate. We compound — every cohort hands the next a heavier baseline.',
  },
  origin: {
    label: 'ORIGIN',
    title: 'Since 1997.',
    body: '1997년 벤처창업연구회로 발족해, 연세대학교에서 가장 오래 이어진 창업학회로 매 학기를 한 권의 잡지처럼 묶어왔습니다. 매 학기가 한 권, 그렇게 쌓인 책장이 우리의 정체성입니다.',
    milestones: [
      { year: '1997', label: 'FOUNDED', note: '벤처창업연구회로 발족' },
      { year: '2026', label: 'VOL.43', note: '43기, 현재 진행 중' },
    ],
  },
  coreValue: {
    label: 'CORE VALUE',
    title: 'VERY의 핵심가치.',
    body: '학회를 받치는 세 개의 기둥. 지식·경험·사람으로 학회를 운영합니다.',
    items: [
      {
        mono: 'KNOWLEDGE',
        title: '지식',
        body: '체계적인 커리큘럼으로 성공적 창업을 위한 지식들을 습득합니다.',
      },
      {
        mono: 'EXPERIENCE',
        title: '경험',
        body: '창업 여정의 시행착오와 성공을 함께하며, 실전 경험을 통해 성장합니다.',
      },
      {
        mono: 'NETWORK',
        title: '사람',
        body: '좋은 팀원이 창업의 시작입니다. VERY는 좋은 사람과의 만남의 장이 됩니다.',
      },
    ],
  },
  mindset: {
    label: 'MINDSET',
    title: 'VERY가 추구하는 인재.',
    body: '두 갈래의 자질. 창업에 대한 진심과, 그것을 행동으로 옮기는 실행력.',
    items: [
      {
        mono: 'SINCERITY',
        title: '창업에 진심인 사람',
        bullets: [
          '세상을 바꿀 사람',
          '10년 뒤에도 스타트업씬에 있을 사람',
          '휴학도 불사할 사람',
        ],
      },
      {
        mono: 'EXECUTION',
        title: '실행력',
        bullets: [
          '고객을 직접 만나는 사람',
          '비전을 즉시 행동으로 옮기는 사람',
          '실패에 대한 두려움이 없는 사람',
        ],
      },
    ],
  },
  whatWeDo: {
    label: 'WHAT WE DO',
    title: '학회는 네 갈래로 움직입니다.',
    items: [
      {
        monoLabel: 'SESSIONS',
        title: '주간 세션',
        body: '케이스 스터디·도메인 리서치·창업 시뮬레이션을 매주 한 묶음으로 진행합니다.',
        href: '/curriculum',
      },
      {
        monoLabel: 'DEMODAY',
        title: '데모데이',
        body: '학기 말, 실제 투자자·창업가·동문 앞에서 학회 팀의 결과물을 발표합니다.',
        href: '/demoday',
      },
      {
        monoLabel: 'ALUMNI',
        title: '알럼나이 네트워크',
        body: '재학·졸업 회원이 멘토링·투자·후속 합류로 이어지는 누적 네트워크입니다.',
        href: '/alumni',
      },
      {
        monoLabel: 'PARTNERS',
        title: '산학·시장 파트너',
        body: '기업·VC·교내 창업 트랙과의 파트너십으로 실전 경험을 확장합니다.',
        href: '/partners',
      },
    ],
  },
  leadership: {
    label: 'LEADERSHIP',
    title: '43기 회장단',
    members: [
      {
        roleMono: 'PRESIDENT',
        role: '회장',
        name: '신현우',
        monoName: 'HYUNWOO SHIN',
      },
      {
        roleMono: 'VICE PRESIDENT',
        role: '부회장',
        name: '구원근',
        monoName: 'WONKEUN KOO',
      },
    ],
  },
  closing: {
    label: 'NEXT',
    title: '다음 학기, 함께 착륙할 사람을 찾고 있습니다.',
    body: '모집 시즌엔 노션·구글폼으로 진행됩니다. 평소엔 메일·인스타로 가볍게 연락 주세요.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
