/**
 * Site navigation items. Order is the order rendered in the top nav.
 *
 * Home(`/`) is intentionally omitted from the list - the wordmark itself
 * links to root. 2026-10-27 개편: 8칸을 5칸으로 줄이고 지원·포털은
 * NAV_ACTIONS 버튼으로 뺐다. 알럼나이는 /cohorts에 합쳤고 연락은 푸터로 옮겼다.
 * 지원 버튼은 상시 노출한다. 접수 중/마감 상태는 /recruit 페이지가
 * DB(recruit_rounds)로 판정해 화면을 바꾼다.
 */
export type NavItem = {
  href: string
  label: string
  /** translate="no" - rendered as a stable English mono accent regardless of locale. */
  monoLabel: string
}

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/about', label: '소개', monoLabel: 'ABOUT' },
  { href: '/curriculum', label: '커리큘럼', monoLabel: 'CURRICULUM' },
  { href: '/demoday', label: '데모데이', monoLabel: 'DEMODAY' },
  { href: '/cohorts', label: '학회원', monoLabel: 'MEMBERS' },
  { href: '/partners', label: '파트너', monoLabel: 'PARTNERS' },
]

/**
 * 상단 오른쪽 버튼. 지원은 방문자가 하는 유일한 행동이라 탭과 떼어 강조하고,
 * 포털은 학회원 입구다(로그인 전이면 /members가 로그인 화면으로 보낸다).
 */
const RECRUIT: NavItem = { href: '/recruit', label: '지원', monoLabel: 'RECRUIT' }
const PORTAL: NavItem = { href: '/members', label: '학회원 포털', monoLabel: 'PORTAL' }

export const NAV_ACTIONS: ReadonlyArray<NavItem> = [RECRUIT, PORTAL]

/** 푸터 EXPLORE 열. 상단에서 뺀 연락 페이지는 여기서 닿는다. */
export const FOOTER_ITEMS: ReadonlyArray<NavItem> = [
  ...NAV_ITEMS,
  RECRUIT,
  { href: '/contact', label: '연락', monoLabel: 'CONTACT' },
  PORTAL,
]
