/**
 * /demoday page content.
 *
 * Tone anchored to VERY_43기_OT.pdf p.4 — "데모데이 / #IR PITCH #MVP /
 * 여러분의 아이디어를 창업을 통해 현실로 만드세요." Demoday is the IR
 * pitch in front of CEO/VC reviewers, not a generic show-and-tell. Keep
 * the copy faithful to that framing.
 *
 * Recent volume titles and dates are placeholders — society will replace
 * with the canonical lineup from past programs. Keep the array length
 * stable (3 entries) so the layout grid doesn't have to handle empty cells.
 */
export const DEMODAY = {
  hero: {
    eyebrow: 'Demoday — Vol.43 / 2026—1',
    headlineLine1: 'IR 피칭,',
    headlineLine2: 'CEO·VC 앞에.',
    subline:
      'IR pitch · MVP. 학기의 마지막 무대. 학회 팀이 한 학기 동안 만든 아이템을 CEO·VC 심사역 앞에 올려, 평가와 투자로 이어 나가는 자리.',
  },
  about: {
    label: 'WHAT IS IT',
    title: '아이디어를, 창업의 현실로.',
    body: '데모데이는 학회 팀이 CEO와 VC 심사역 앞에서 IR 피칭을 진행하여 평가 및 투자를 받는 자리입니다. 매 학기 학회가 만들어온 결과물을 외부 청중 앞에 처음 꺼내놓는 무대로, 매 권의 마지막 장이자 다음 권의 첫 줄이 되도록 설계되어 있습니다.',
  },
  format: {
    label: 'FORMAT',
    title: '한 저녁, 모든 팀, IR 피칭.',
    body: '학기 말 하루 저녁, 학회의 모든 팀이 같은 무대에서 IR 피칭을 진행합니다. CEO·VC 심사역의 평가와 동문·교수진의 합석으로 세 막이 이어집니다.',
    stats: [
      { value: '1일', label: 'SINGLE NIGHT', note: '학기 말 하루 저녁' },
      { value: '10팀+', label: 'TEAMS', note: '학회의 모든 팀' },
      { value: '3막', label: 'ACTS', note: 'IR 피칭 · 심사 · 네트워킹' },
    ],
  },
  volumes: {
    label: 'RECENT VOLUMES',
    title: '가장 최근의 표지들.',
    items: [
      {
        volume: 'VOL.43',
        year: '2026',
        status: 'UPCOMING',
        title: '준비 중',
        note: '현재 진행 중인 학기의 데모데이. 일정은 모집 시즌에 함께 공지됩니다.',
      },
      {
        volume: 'VOL.42',
        year: '2025',
        status: 'CLOSED',
        title: '직전 학기',
        note: '동문·외부 청중과 함께 마무리한 직전 회차. 정식 리캡은 추후 아카이브로 정리됩니다.',
      },
      {
        volume: 'VOL.41',
        year: '2025',
        status: 'CLOSED',
        title: '한 권 더 전',
        note: '학회가 매 학기 표지를 만들어온 누적의 한 권. 자세한 기록은 향후 아카이브 페이지에서.',
      },
    ],
  },
  audience: {
    label: 'AUDIENCE',
    title: '무대 아래 어떤 사람들이 앉는지.',
    items: [
      {
        mono: 'ALUMNI',
        title: '학회 동문',
        body: '직전 학기를 함께 끝낸 졸업 회원·이전 권의 회장단·창업가 동문이 객석의 절반을 차지합니다.',
      },
      {
        mono: 'INVESTORS',
        title: '투자자 · 액셀러레이터',
        body: 'CEO와 VC 심사역이 IR 피칭을 직접 평가합니다. 평가는 그 자리에서 끝나지 않고, 후속 미팅·투자 검토로 이어집니다.',
      },
      {
        mono: 'FACULTY',
        title: '교수 · 산학 파트너',
        body: '연세대학교 창업 트랙과 산학 파트너십을 함께 가져가는 교내·외부 관계자가 객석에 함께합니다.',
      },
    ],
  },
  closing: {
    label: 'JOIN',
    title: '다음 권의 표지 위에 올라설 사람을 찾습니다.',
    body: '발표 무대에 서는 팀의 시작은 모집입니다. 시즌엔 노션·구글폼으로 진행됩니다.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
