/**
 * /partners page content.
 *
 * Partner roster is intentionally placeholder-shaped. Society will fill
 * names/logos once relationships are confirmed for the current volume.
 * Three categories (corporate / capital / academic) match how the
 * society actually thinks about external relationships.
 */
export const PARTNERS = {
  hero: {
    eyebrow: 'Partners — Vol.43 / 2026—1',
    headlineLine1: '책장 바깥에서,',
    headlineLine2: '같이 들고 가는 손.',
    subline:
      'Outside the spine. The volume is ours — the weight is shared with companies, capital, and the university.',
  },
  intro: {
    label: 'WHY',
    title: '학회만으로는 끝까지 못 갑니다.',
    body: '한 학기를 한 권의 잡지로 묶으려면 학회 안의 시간만으로는 부족합니다. 시장의 문제는 기업이, 자본의 언어는 VC가, 트랙과 자원은 학교가 갖고 있습니다. VERY의 파트너십은 그 세 갈래를 한 학기 안으로 끌어오는 통로입니다.',
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
    title: '이번 권을 함께 만드는 손.',
    note: '정식 파트너 로스터는 학기 중반 공식 공지와 함께 갱신됩니다. 아래는 카테고리별 자리만 잡아둔 표지입니다.',
    items: [
      { category: 'CORPORATE', name: 'TBA', note: '도메인 리서치 협업 트랙' },
      { category: 'CORPORATE', name: 'TBA', note: '필드 비짓 · PoC' },
      { category: 'CAPITAL', name: 'TBA', note: '데모데이 청중 · 후속 미팅' },
      { category: 'CAPITAL', name: 'TBA', note: '동문 VC · 엔젤' },
      { category: 'ACADEMIC', name: '연세대학교', note: '창업 트랙 · 산학 협력' },
      { category: 'ACADEMIC', name: 'TBA', note: '교내 창업 지원 기관' },
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
    title: '같이 들고 갈 권이 있으면 말씀 주세요.',
    body: '파트너십 문의는 메일로 받습니다. 학기 단위라 시즌별 윈도우가 좁으니 가능하면 학기 시작 전에 연결해 주세요.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
