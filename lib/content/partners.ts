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
      '이 땅은 결코 우리 혼자 다질 수 없습니다. 기업과 자본, 대학이 그 아래에서 묵묵히 함께 받쳐 줍니다.',
  },
  intro: {
    label: 'WHY',
    title: '학회 안의 시간만으론 끝까지 못 갑니다.',
    body: '한 학기 동안 단단한 지반을 다지는 일은 학회 안의 시간만으로는 닿지 않는 길입니다. 시장의 문제는 기업이, 자본의 언어는 VC가, 트랙과 자원은 학교가 쥐고 있습니다. VERY의 파트너십은 이 세 갈래를 한 학기 안으로 이어 붙이는 다리입니다.',
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
    title: '이번 학기, 함께 지반을 다진 파트너들.',
    note: '모든 파트너와는 학기 안에서 서로의 자리를 오가며 함께 호흡합니다. 학기 중 새로 합류하는 파트너 소식은 인스타그램을 통해 가장 먼저 전해 드립니다.',
  },
  engage: {
    label: 'ENGAGE',
    title: '파트너십, 이렇게 시작합니다.',
    items: [
      {
        mono: 'BRIEF',
        title: '문제를 가져오기',
        body: '풀어보고 싶은 시장 문제나 도메인을 한두 문단으로 정리해 보내 주세요. 학회 팀이 학기 리서치 단계에서 직접 들여다보겠습니다.',
      },
      {
        mono: 'PROGRAM',
        title: '학기 트랙에 얹기',
        body: '워크숍과 게스트 토크, 필드 비짓의 형태로 한 학기 동안 학회 안에 자리를 마련합니다. 세부 일정은 학기 시작 전에 함께 조율해 드립니다.',
      },
      {
        mono: 'STAGE',
        title: '데모데이 무대로',
        body: '학기 말 데모데이에 청중과 심사, 후속 미팅의 파트너로 참여하실 수 있습니다. 학회 팀과 가장 가까이에서 마주할 수 있는 자리입니다.',
      },
    ],
  },
  closing: {
    label: 'CONTACT',
    title: '함께 받칠 학기가 있다면, 언제든 말씀 주십시오.',
    body: '파트너십 문의는 메일로 받고 있습니다. 학기 단위로 움직이다 보니 시즌마다 자리가 한정적입니다. 학기 시작 전에 미리 연락 주시면 더 매끄럽게 이어 갈 수 있습니다.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const

/**
 * Logos for the pre-footer marquee strip rendered site-wide via
 * `(marketing)/layout.tsx`. Order is the order they appear in the loop.
 * Source files live in `/public/partners/`.
 */
/**
 * `invert: true` forces the logo to render as a pure white silhouette
 * via CSS `brightness-0 invert` — used for marks whose source artwork
 * only contains dark fills and would otherwise read as black-on-black
 * against the site background.
 */
export type PartnerLogo = {
  name: string
  src: string
  invert?: boolean
}

export const PARTNER_LOGOS: readonly PartnerLogo[] = [
  { name: '노코더스', src: '/partners/nocoders.svg' },
  { name: '티오더', src: '/partners/toorder.svg' },
  { name: 'ZUZU', src: '/partners/zuzu.svg' },
  { name: '알파브라더스', src: '/partners/alphabrothers.svg' },
  { name: 'abmlab', src: '/partners/abmlab.svg' },
  { name: '연세대 공과대학', src: '/partners/yonsei-engineering.svg' },
  { name: '벤처캐피탈협회', src: '/partners/kvca.svg' },
]
