/**
 * Site navigation items. Order is the order rendered in the top nav.
 *
 * Home(`/`) is intentionally omitted from the list — the wordmark itself
 * links to root. Recruit is seasonal and gated on RECRUIT_OPEN; it lives
 * outside this constant so it can be appended at render time.
 */
export type NavItem = {
  href: string
  label: string
  /** translate="no" — rendered as a stable English mono accent regardless of locale. */
  monoLabel: string
}

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: '/about', label: '소개', monoLabel: 'ABOUT' },
  { href: '/curriculum', label: '커리큘럼', monoLabel: 'CURRICULUM' },
  { href: '/demoday', label: '데모데이', monoLabel: 'DEMODAY' },
  { href: '/alumni', label: '알럼나이', monoLabel: 'ALUMNI' },
  { href: '/partners', label: '파트너', monoLabel: 'PARTNERS' },
  { href: '/contact', label: '연락', monoLabel: 'CONTACT' },
]
