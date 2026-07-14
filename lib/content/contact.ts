/**
 * /contact page content.
 *
 * Channels-only. 신청 폼은 두지 않고 실제 담당자가 회신하는 채널만
 * 노출한다. 43기 진행 중(landing)에는 모집 접수를 열지 않으므로,
 * 상단 STATUS 섹션에서 그 상태를 먼저 알린다.
 */
import { SITE } from './site'

export const CONTACT = {
  hero: {
    eyebrow: 'Contact — Vol.43 / 2026—1',
    headlineLine1: 'Get in touch.',
    headlineLine2: '사람이 직접 답장합니다.',
    subline:
      '모집·파트너십·언론 문의는 이메일과 인스타그램으로 받고 있습니다.',
  },
  intro: {
    label: 'STATUS',
    title: '지금은 신청 기간이 아닙니다.',
    body: '현재 43기가 landing 중입니다. 다음 기수 모집이 열리기 전까지는 별도의 신청 폼을 두지 않고, 아래 채널로 보내주시는 문의는 실제 담당자가 확인해 회신드립니다.',
  },
  channels: {
    label: 'CHANNELS',
    title: 'Three channels.',
    items: [
      {
        mono: 'EMAIL',
        label: SITE.email,
        href: `mailto:${SITE.email}`,
        note: '학회 공식 메일. 파트너십·언론·일반 문의를 모두 이곳에서 받습니다.',
        external: false,
      },
      {
        mono: 'INSTAGRAM',
        label: '@very_yonsei',
        href: SITE.instagram,
        note: '학기 중 가장 자주 업데이트되는 채널. 모집 시즌 공지도 여기에 가장 먼저 올라옵니다.',
        external: true,
      },
      {
        mono: 'RECRUIT',
        label: '시즌별 노션 · 구글폼',
        href: SITE.recruitFormUrl,
        note: '모집 시즌에만 노션·구글폼으로 접수합니다. 현재는 43기 landing 중이라 다음 시즌 오픈 시 인스타그램으로 안내드립니다.',
        external: true,
      },
    ],
  },
  faq: {
    label: 'FAQ',
    title: '자주 묻는 것들.',
    items: [
      {
        q: '학회는 언제 모집하나요?',
        a: '학기 시작 전(보통 2월·8월) 시즌으로 모집합니다. 정확한 일정은 인스타그램에 가장 먼저 올라갑니다.',
      },
      {
        q: '연세대학교 학생만 지원할 수 있나요?',
        a: '기본은 연세대 재학생 대상이지만, 시즌별로 외부 협업 트랙이 열리기도 합니다. 시즌 공지를 참고해 주세요.',
      },
      {
        q: '회신은 얼마나 걸리나요?',
        a: '학기 중엔 보통 영업일 기준 3~5일 안에 회신합니다. 모집·데모데이 시즌엔 다소 지연될 수 있습니다.',
      },
    ],
  },
  closing: {
    label: 'STILL HERE',
    title: '메시지를 기다리고 있습니다.',
    body: '문의든 협업 제안이든, 짧게 남겨주시면 담당자가 확인 후 이메일로 회신드립니다.',
    primary: { label: 'EMAIL US', href: `mailto:${SITE.email}` },
    secondary: { label: '@VERY_YONSEI', href: SITE.instagram },
  },
} as const
