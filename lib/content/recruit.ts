/**
 * /recruit page content — 44기 모집 시즌 카피.
 *
 * 시즌마다 이 파일만 갱신한다. 접수 open/close는 코드가 아니라
 * 어드민(/admin/recruit)의 recruit_rounds.apply_open 토글이 결정한다.
 *
 * ⚠️ 일정·유의사항 값은 44기 제01차 운영위 회의록 기준. 확정 전 변동 시
 * 여기만 고치면 된다.
 */

export const RECRUIT = {
  hero: {
    eyebrow: 'Recruit · Vol.44 / 2026-2',
    headlineLine1: '다음 권의 저자를 찾습니다.',
    subline:
      '연세대학교 창업학회 VERY가 44기 학회원을 모집합니다. 한 학기 동안 아이디어를 실물로 만들고, 데모데이 무대에서 결산합니다.',
  },
  schedule: {
    label: 'SCHEDULE',
    title: '모집 일정.',
    items: [
      { mono: 'APPLY', label: '서류 접수', value: '8.4(화) ~ 8.23(일) 23:59' },
      { mono: 'DOCS', label: '서류 결과 발표', value: '8.25(화)' },
      { mono: 'INTERVIEW', label: '면접', value: '8.28(금) ~ 8.29(토)' },
      { mono: 'FINAL', label: '최종 합격자 발표', value: '9.1(화)' },
      { mono: 'OT', label: 'OT · 1주차 세션', value: '9.3(목), 합격자 전원 필참' },
    ],
  },
  howTo: {
    label: 'HOW TO APPLY',
    title: '지원 방법.',
    steps: [
      '아래 버튼에서 지원서 양식을 내려받아 작성합니다.',
      '작성한 지원서를 PDF로 저장합니다. (5MB 이하)',
      '이 페이지 하단 폼에 인적사항과 함께 PDF를 업로드하면 접수가 완료됩니다.',
    ],
    // TODO(44기): 44기 양식 페이지가 준비되면 교체. 현재는 43기 공식 페이지.
    formTemplateUrl:
      'https://www.notion.so/VERY-2ecac92f678780a6a8c8c3ecc0ad1df0',
    formTemplateLabel: '지원서 양식 (VERY 공식 페이지)',
  },
  notice: {
    label: 'NOTICE',
    title: '지원 전 유의사항.',
    items: [
      '활동 기간: 2026.9.3(목) ~ 2027.1.23(토)',
      '정규 세션: 매주 목요일 19:00 ~ 21:00',
      '정규 세션 장소: 마루180, 창업허브, 디캠프, 연세대학교 공학관 등 서울 각지',
      'MT: 9.19(토) ~ 9.20(일)',
      '데모데이: 2027.1.23(토)',
      '정규 세션, OT, MT, 데모데이는 필참이며, 3회 이상 결석 시 제명 및 정회원 인정 불가',
    ],
  },
  closedNotice: {
    title: '지금은 접수 기간이 아닙니다.',
    body: '모집 일정은 인스타그램에 가장 먼저 올라갑니다. 시즌이 열리면 이 페이지에서 바로 접수할 수 있습니다.',
  },
  contactNote:
    '문의: yonseivery1997@gmail.com · @very_yonsei',
} as const
