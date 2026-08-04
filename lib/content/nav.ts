/**
 * Site navigation items. Order is the order rendered in the top nav.
 *
 * Home(`/`) is intentionally omitted from the list - the wordmark itself
 * links to root. Recruit 항목은 상시 노출한다. 접수 중/마감 상태는
 * /recruit 페이지가 DB(recruit_rounds)로 판정해 화면을 바꾼다.
 */
export type NavItem = {
  href: string
  label: string
  /** translate="no" - rendered as a stable English mono accent regardless of locale. */
  monoLabel: string
}

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/recruit', label: '지원', monoLabel: 'RECRUIT' },
  { href: '/about', label: '소개', monoLabel: 'ABOUT' },
  { href: '/cohorts', label: '학회원', monoLabel: 'MEMBERS' },
  { href: '/curriculum', label: '커리큘럼', monoLabel: 'CURRICULUM' },
  { href: '/demoday', label: '데모데이', monoLabel: 'DEMODAY' },
  { href: '/alumni', label: '알럼나이', monoLabel: 'ALUMNI' },
  { href: '/partners', label: '파트너', monoLabel: 'PARTNERS' },
  { href: '/contact', label: '연락', monoLabel: 'CONTACT' },
]
