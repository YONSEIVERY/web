/**
 * /about page content.
 *
 * Five blocks: Hero, Origin, What We Do, Leadership, Closing.
 * Keep copy in a single tree so the page stays a thin markup layer and
 * the society can edit text in one place.
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
