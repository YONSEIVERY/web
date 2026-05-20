/**
 * /partners page content.
 *
 * Brand metaphor (per VERY BI doc): the partner program is the bedrock
 * under the field — companies, capital, and the university are what
 * make the ground load-bearing. Body copy uses 지반 / 필드 / 함께 일군;
 * magazine vocabulary (책장 / 한 권 / 표지) is no longer used.
 *
 * Roster lists this volume's confirmed partners. Three categories
 * (corporate / capital / academic) describe what kind of company each
 * partner is — they do NOT describe the partnership terms. The society
 * has decided not to expose deal specifics (sponsorship, AC commitment,
 * etc.) publicly; every partner is framed identically as "파트너십을
 * 통한 상호 교류" on the site. Per-row `note` is a one-line company
 * descriptor only.
 */
export const PARTNERS = {
  hero: {
    eyebrow: 'Partners — Vol.43 / 2026—1',
    headlineLine1: '땅 밑을 받치는',
    headlineLine2: '단단한 지반.',
    subline:
      'Bedrock under the field. 우리가 일구는 땅은 우리 혼자 다지지 않습니다. 기업·자본·대학이 그 아래를 함께 받칩니다.',
  },
  intro: {
    label: 'WHY',
    title: '학회 안의 시간만으론 끝까지 못 갑니다.',
    body: '한 학기 동안 지반을 다지려면 학회 안의 시간만으로는 부족합니다. 시장의 문제는 기업이, 자본의 언어는 VC가, 트랙과 자원은 학교가 갖고 있습니다. VERY의 파트너십은 그 세 갈래를 한 학기 안으로 끌어오는 통로입니다.',
  },
  categories: {
    label: 'CATEGORIES',
    title: '세 갈래로 묶습니다.',
    items: [
      {
        num: '01',
        mono: 'CORPORATE',
        title: '기업 파트너',
        body: '실제 시장 문제를 학회 팀에 던져주는 산업 파트너. 도메인 리서치·필드 비짓·PoC로 학기 안에 직접 연결됩니다.',
      },
      {
        num: '02',
        mono: 'CAPITAL',
        title: 'VC · 액셀러레이터',
        body: '데모데이 무대의 청중이자, 학회 팀의 첫 미팅 상대. 동문 네트워크를 통해 시드·시리즈 단계까지 자연스럽게 이어집니다.',
      },
      {
        num: '03',
        mono: 'ACADEMIC',
        title: '교내 · 산학',
        body: '연세대학교 창업 트랙·교수진·교내 창업 기관과의 파트너십. 학회 활동을 정규 트랙·지원금·공간으로 확장합니다.',
      },
    ],
  },
  roster: {
    label: 'CURRENT VOLUME',
    title: '이번 학기를 함께 받치는 손.',
    note: '각 파트너와는 파트너십을 통한 상호 교류를 진행합니다. 학기 중 추가되는 파트너는 인스타그램으로 안내합니다.',
    items: [
      {
        category: 'CORPORATE',
        name: 'ZUZU',
        note: '주식·법무·재무를 한 곳에서 관리하는 스타트업 운영 SaaS · by KODEBOX',
      },
      {
        category: 'CORPORATE',
        name: 'NOCODERS',
        note: '노코드 도구로 MVP를 빠르게 만드는 빌더·교육 커뮤니티',
      },
      {
        category: 'CAPITAL',
        name: 'ALPHA BROTHERS',
        note: '초기 단계 스타트업에 투자하는 액셀러레이터',
      },
      {
        category: 'ACADEMIC',
        name: '연세대학교',
        note: 'VERY의 모교 · 학회 활동의 거점',
      },
    ],
  },
  engage: {
    label: 'ENGAGE',
    title: '파트너십, 이렇게 시작합니다.',
    items: [
      {
        mono: 'BRIEF',
        title: '문제를 가져오기',
        body: '풀고 싶은 시장·도메인 문제를 한두 문단으로 보내주세요. 학회 팀이 학기 리서치 단계에서 직접 들여다봅니다.',
      },
      {
        mono: 'PROGRAM',
        title: '학기 트랙에 얹기',
        body: '워크숍·게스트 토크·필드 비짓 형태로 한 학기 동안 학회 안에 자리를 둡니다. 일정은 학기 시작 전 조율합니다.',
      },
      {
        mono: 'STAGE',
        title: '데모데이 무대로',
        body: '학기 말 데모데이에 청중·심사·후속 미팅 파트너로 참여합니다. 학회 팀과 연결될 수 있는 가장 직접적인 자리입니다.',
      },
    ],
  },
  closing: {
    label: 'CONTACT',
    title: '함께 받칠 학기가 있으면 말씀 주세요.',
    body: '파트너십 문의는 메일로 받습니다. 학기 단위라 시즌별 윈도우가 좁으니 가능하면 학기 시작 전에 연결해 주세요.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
