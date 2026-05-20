/**
 * /contact page content.
 *
 * No form on this page yet. The society doesn't have a routing inbox
 * wired, and a fake form is worse than no form. We surface the three
 * real channels (email, instagram, recruit form when open) and tell
 * users which one to use for what.
 *
 * Vocabulary note: this page (and /demoday) is where the FIELD vocabulary
 * from the VERY BI doc lands — members are "Operators", teams are "Unit",
 * projects are "Mission". Elsewhere on the site we stay with plain 회원/
 * 팀/프로젝트.
 */
import { SITE } from './site'

export const CONTACT = {
  hero: {
    eyebrow: 'Contact — Vol.43 / 2026—1',
    headlineLine1: '문은 세 개,',
    headlineLine2: '모두 사람이 받습니다.',
    subline:
      'Three real doors, no contact form. Recruiting, partnership, press — 어떤 용건이든 실제 사람이 받습니다.',
  },
  intro: {
    label: 'NOTE',
    title: '폼은 두지 않습니다.',
    body: '문의 폼 대신 실제 사람이 읽는 채널만 둡니다. 학기 중엔 메일이 가장 확실하고, 평소 학회 분위기는 인스타그램에서 가장 빨리 확인할 수 있습니다.',
  },
  channels: {
    label: 'CHANNELS',
    title: '세 개의 문.',
    items: [
      {
        mono: 'EMAIL',
        label: SITE.email,
        href: `mailto:${SITE.email}`,
        note: '학회 공식 메일. 파트너십·언론 문의·일반 문의 모두 이곳으로.',
        external: false,
      },
      {
        mono: 'INSTAGRAM',
        label: '@very_yonsei',
        href: SITE.instagram,
        note: '학기 중 가장 자주 갱신되는 채널. 모집 시즌 공지도 가장 먼저 올라갑니다.',
        external: true,
      },
      {
        mono: 'RECRUIT',
        label: '시즌별 노션 · 구글폼',
        href: SITE.recruitFormUrl,
        note: 'Operators 모집은 학기 시작 전에 노션·구글폼으로 받습니다. 시즌 오픈 시 인스타로 안내.',
        external: true,
      },
    ],
  },
  tracks: {
    label: 'TRACKS',
    title: '용건별로 어디로 가는 게 좋은지.',
    items: [
      {
        num: '01',
        mono: 'RECRUIT',
        title: 'Operator 지원',
        body: '모집 시즌엔 노션·구글폼으로 받습니다. 새 학기의 Unit으로 합류하고 싶다면 이쪽. 시즌이 닫혀 있다면 인스타그램에서 다음 시즌 일정을 확인해 주세요.',
      },
      {
        num: '02',
        mono: 'PARTNERSHIP',
        title: '파트너십 · 산학',
        body: '기업·VC·교내 트랙 등 학기 단위 파트너십 문의는 메일로 받습니다. 학기 시작 전에 연결해 주시면 트랙에 얹기 수월합니다.',
      },
      {
        num: '03',
        mono: 'PRESS',
        title: '언론 · 외부 협업',
        body: '인터뷰·기사·외부 행사 협업은 메일로 받습니다. 회신은 학기 일정에 따라 다소 시간이 걸릴 수 있습니다.',
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
    title: '여기까지 읽었다면, 일단 한 줄 보내주세요.',
    body: '완성된 문장이 아니어도 괜찮습니다. 어떤 용건인지 한 줄만 적어주시면, 다음 학기 같이 다질 자리부터 찾아보겠습니다.',
    primary: { label: 'EMAIL US', href: `mailto:${SITE.email}` },
    secondary: { label: '@VERY_YONSEI', href: SITE.instagram },
  },
} as const
