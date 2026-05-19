/**
 * /demoday page content.
 *
 * Recent volume titles and dates are placeholders — society will replace
 * with the canonical lineup from past programs. Keep the array length
 * stable (3 entries) so the layout grid doesn't have to handle empty cells.
 */
export const DEMODAY = {
  hero: {
    eyebrow: 'Demoday — Vol.43 / 2026—1',
    headlineLine1: '학기 끝,',
    headlineLine2: '그리고 표지.',
    subline:
      'On the cover. Every volume ends on a public stage — pitches, demos, and a room full of people who have built this before.',
  },
  about: {
    label: 'WHAT IS IT',
    title: '한 학기를 한 무대 위로.',
    body: '데모데이는 학회 팀이 한 학기 동안 만들어온 것을 외부 청중 앞에 처음 꺼내놓는 자리입니다. 학기의 ‘표지’가 되는 무대로, 매 권의 마지막 장이자 다음 권의 첫 줄이 되도록 설계되어 있습니다.',
  },
  format: {
    label: 'FORMAT',
    title: '한 저녁, 모든 팀, 한 무대.',
    body: '학기 말 하루 저녁, 학회의 모든 팀이 같은 무대에서 발표합니다. 발표 → Q&A → 네트워킹의 세 막으로 진행되며, 동문·투자자·교수진이 청중으로 참여합니다.',
    stats: [
      { value: '1일', label: 'SINGLE NIGHT', note: '학기 말 하루 저녁' },
      { value: '10팀+', label: 'TEAMS', note: '학회의 모든 팀' },
      { value: '3막', label: 'ACTS', note: '발표 · Q&A · 네트워킹' },
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
        body: '동문 네트워크를 통해 합류한 VC·AC가 학회 팀의 발표를 듣고 후속 미팅으로 이어집니다.',
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
