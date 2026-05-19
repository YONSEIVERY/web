/**
 * /curriculum page content.
 *
 * Society has not finalized exact week counts / hour blocks — figures here
 * are reasonable defaults that match how recent volumes have run. Swap in
 * authoritative numbers once they're confirmed.
 */
export const CURRICULUM = {
  hero: {
    eyebrow: 'Curriculum — Vol.43 / 2026—1',
    headlineLine1: '한 학기,',
    headlineLine2: '한 권의 잡지.',
    subline:
      'One semester. One volume. Every cohort assembles a single body of work — sessions are chapters, demoday is the cover.',
  },
  format: {
    label: 'FORMAT',
    title: '학기 단위, 주간 세션.',
    body: '한 학기를 한 권의 잡지처럼 묶습니다. 매주 세션이 한 챕터, 학기 말 데모데이가 표지가 되는 구조로 — 흐름이 끊기지 않게, 누적되도록 설계되어 있습니다.',
    stats: [
      { value: '12주', label: 'WEEKS', note: '한 학기의 길이' },
      { value: '3시간', label: 'PER SESSION', note: '매주 1회 정기 세션' },
      { value: '4단계', label: 'PHASES', note: '온보딩부터 데모데이까지' },
    ],
  },
  phases: {
    label: 'PHASES',
    title: '학기는 네 단계로 흐릅니다.',
    items: [
      {
        num: '01',
        mono: 'ONBOARDING',
        title: '온보딩 · 팀 빌딩',
        body: '새 회원과 기존 회원이 한 팀으로 묶이는 첫 단계. 학회의 언어·도구·아카이브를 공유하고, 한 학기를 함께 끌고 갈 팀을 확정합니다.',
      },
      {
        num: '02',
        mono: 'DOMAIN RESEARCH',
        title: '도메인 리서치',
        body: '관심 산업·시장을 깊게 파고드는 단계. 시장 구조, 플레이어, 미해결 문제를 직접 만나서 정리하고 학회 내부에 발표합니다.',
      },
      {
        num: '03',
        mono: 'IDEA SPRINT',
        title: '아이디어 스프린트',
        body: '리서치를 가설로, 가설을 프로토타입으로 빠르게 옮기는 단계. 매주 한 사이클씩 만들고 부수고 다시 세웁니다.',
      },
      {
        num: '04',
        mono: 'DEMODAY PREP',
        title: '데모데이 준비',
        body: '학기의 결과물을 외부에 발표할 수 있는 형태로 다듬는 단계. 피치 덱·시연 시나리오·예상 질문을 모의 발표에서 반복합니다.',
      },
    ],
  },
  workshops: {
    label: 'WORKSHOPS',
    title: '세션 너머의 활동.',
    items: [
      {
        mono: 'CASE STUDY',
        title: '케이스 스터디',
        body: '국내외 스타트업·실패 사례를 함께 분해하고, 우리 팀의 가정에 다시 대입해 봅니다.',
      },
      {
        mono: 'GUEST TALK',
        title: '게스트 토크',
        body: '학회 동문 창업자·현직 VC·도메인 전문가를 초청해 묻고 답하는 자리.',
      },
      {
        mono: 'FIELD VISIT',
        title: '필드 비짓',
        body: '관심 도메인의 실제 현장을 찾아가 보는 활동. 보고 들은 것은 곧장 다음 주 세션의 재료가 됩니다.',
      },
    ],
  },
  closing: {
    label: 'JOIN',
    title: '다음 권의 페이지를 함께 채울 사람을 찾습니다.',
    body: '모집 시즌엔 노션·구글폼으로 진행됩니다. 평소엔 메일·인스타로 가볍게 연락 주세요.',
    primary: { label: 'CONTACT', href: '/contact' as const },
    secondary: {
      label: '@VERY_YONSEI',
      href: 'https://instagram.com/very_yonsei',
    },
  },
} as const
