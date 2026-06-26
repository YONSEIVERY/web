/**
 * /demoday 정적 카피.
 *
 * 회차별로 바뀌는 정보(헤드라인의 회차 표기, 일정, 포스터, 신청 폼 옵션,
 * 과거 회차 목록)는 모두 `demoday_events` 테이블에서 가져온다. 여기 남는
 * 것은 시즌이 바뀌어도 그대로 유지되는 톤·카피뿐이다.
 *
 * Tone: VERY_43기_OT.pdf p.4 — "데모데이 / #IR PITCH #MVP". CEO/VC 심사역
 * 앞 IR 피칭이라는 프레임을 유지한다. 이 페이지에서는 학회 팀을 "Unit"이 아닌
 * "창업팀"으로 표기 (회장 지침). FIELD 어휘는 /contact recruit에서만 사용.
 */
export const DEMODAY = {
  hero: {
    eventTitle: 'VERIFY',
    headlineLine1: 'VERY 43기 데모데이',
    headlineLine2: '',
    subline:
      '학기의 마지막 무대. 한 학기 동안 다진 프로젝트를 CEO·VC 심사역 앞에 올려, 평가와 투자로 이어 나가는 자리.',
  },
  about: {
    label: 'WHAT IS IT',
    title: '아이디어를, 창업의 현실로.',
    body: '데모데이는 학회의 창업팀이 CEO·VC 심사역 앞에서 IR 피칭을 선보이며 평가와 투자로 이어 가는 자리입니다. 한 학기 동안 다져 온 지반 위에서 처음으로 외부 청중을 마주하는 무대이자, 한 학기의 마지막이며 다음 학기 모집의 첫 신호가 됩니다.',
  },
  format: {
    label: 'FORMAT',
    title: '최종 무대, 모든 창업팀, IR 피칭.',
    body: '학기 말 하루, 학회의 모든 창업팀이 같은 무대에 오릅니다. CEO·VC 심사역의 평가와 동문·교수진의 합석으로 한 학기 커리큘럼의 결산이 이루어집니다.',
    stats: [
      { value: '1일', label: 'ONE STAGE', note: '학기 말 결산 무대' },
      { value: '10+', label: 'TEAMS', note: '액팅 · 알럼 양쪽 모두' },
      { value: '100+', label: 'GUESTS', note: '심사역 · 동문 · 교내 게스트' },
    ],
  },
  volumes: {
    label: 'RECENT VOLUMES',
    title: '최근의 무대들.',
  },
  audience: {
    label: 'AUDIENCE',
    title: '무대 아래 어떤 사람들이 앉는지.',
    items: [
      {
        mono: 'ALUMNI',
        title: '학회 동문',
        body: '직전 학기를 함께 마친 졸업 Operators와 이전 기수의 회장단, 그리고 창업가 동문이 객석의 절반을 채웁니다.',
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
  schedule: {
    label: 'SCHEDULE',
    title: '타임테이블.',
  },
  closing: {
    label: 'JOIN',
    title: '다음 무대에 올라설 팀을 찾습니다.',
    body: '메일이나 인스타그램으로 가볍게 연락 주세요. 시즌 일정은 인스타에 가장 먼저 올라갑니다.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
