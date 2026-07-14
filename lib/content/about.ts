/**
 * /about page content.
 *
 * Eight blocks: Hero, Origin, Manifesto, Core Value, Mindset, What We Do,
 * Leadership, Closing.
 *
 * Brand metaphor anchor (per VERY BI doc): "We are the very first ground
 * where ideas meet reality." All body copy uses GROUND / FIELD / 착지 /
 * 지반 vocabulary — NOT the magazine vocabulary (책장 / 표지 / 한 권)
 * that the site once used. Volume markers (VOL.43 / EST.1997) stay only
 * as masthead-style metadata.
 *
 * Core Value(KNOWLEDGE/EXPERIENCE/NETWORK) and Mindset(인재상) are lifted
 * verbatim from VERY_43기_OT.pdf p.5–6 — do not paraphrase. The OT deck
 * is what every recruit reads first, so the on-site copy must match.
 */
export const ABOUT = {
  hero: {
    eyebrow: 'About — Vol.43 / 2026—1',
    headlineLine1: '아이디어가 현실을',
    headlineLine2: '처음 마주하는 땅.',
    subline:
      '매 학기, 더 단단해진 지반 위에서 다음 기수가 착지합니다.',
  },
  origin: {
    label: 'ORIGIN',
    title: 'Since 1997.',
    body: '1997년 벤처창업연구회로 발족한 이래, 연세대학교에서 가장 오랜 명맥을 이어 온 창업학회로서 매 학기 더 단단해진 지반을 다음 기수에게 물려주어 왔습니다. 학기마다 새로 일군 땅, 그 누적이 곧 학회의 정체성입니다.',
    milestones: [
      { year: '1997', label: 'FOUNDED', note: '벤처창업연구회로 발족' },
      { year: '2026', label: 'VOL.43', note: '43기, 현재 진행 중' },
    ],
  },
  manifesto: {
    label: 'MANIFESTO',
    title: 'Do. Fail. Repeat.',
    body: '실패는 피할 게 아니라 반복하고 활용하는 방법입니다. 실행 → 실패 → 다시 실행. VERY가 일하는 단 하나의 사이클이며, 학기마다 우리가 다지는 지반의 단위입니다.',
    lines: [
      'Fail Forward — 실패는 피하지 않고, 성장의 방법으로 재사용한다.',
      'Low Barrier, High Intensity — 누구에게나 열려 있되, 끝까지 가는 사람만 남는다.',
      'Real-world Deployment — 아이디어는 책상 위가 아니라 현실 안에서 지금 검증한다.',
    ],
  },
  coreValue: {
    label: 'CORE VALUE',
    title: 'VERY의 핵심가치.',
    body: 'VERY를 떠받치는 세 기둥. 지식과 경험, 그리고 사람으로 학회가 움직입니다.',
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
    title: '학회는 네 가지 축으로 움직입니다.',
    items: [
      {
        monoLabel: 'SESSIONS',
        title: '주간 세션',
        body: '정규 커리큘럼 4단계(10만플·프리토타이핑·아이디어톤·데모데이)와 스터디·인사이트·컨벤션 세션을 매주 병행합니다.',
        href: '/sessions',
      },
      {
        monoLabel: 'DEMODAY',
        title: '데모데이',
        body: '학기 말에 CEO·VC 심사역 앞에서 IR 피칭을 진행하고, 그 결과가 실제 평가와 투자로 이어집니다.',
        href: '/demoday',
      },
      {
        monoLabel: 'ALUMNI',
        title: '알럼나이 네트워크',
        body: '재학생과 졸업생을 잇는 네트워크입니다. 멘토링·투자·팀 합류가 여기서 시작됩니다.',
        href: '/alumni',
      },
      {
        monoLabel: 'PARTNERS',
        title: '산학·시장 파트너',
        body: '기업, VC, 교내 창업 지원 프로그램과 협력하며, 학회원이 실제 시장·자본과 만나는 자리를 만듭니다.',
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
    title: '다음 학기에 함께 착지할 사람을 찾고 있습니다.',
    body: '메일이나 인스타그램으로 가볍게 연락 주세요. 시즌 일정은 인스타에 가장 먼저 올라갑니다.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
