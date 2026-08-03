'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'

type NavItem = { href: Route; label: string }

const MEMBER_ITEMS: NavItem[] = [
  { href: '/members' as Route, label: '홈' },
  { href: '/members/attendance' as Route, label: '내 출결' },
]

const EXEC_ITEMS: NavItem[] = [
  { href: '/members/manage/sessions' as Route, label: '세션 관리' },
  { href: '/members/manage/notices' as Route, label: '공지 관리' },
  { href: '/members/manage/attendance' as Route, label: '출결 관리' },
]

function isActive(pathname: string, href: string) {
  return href === '/members'
    ? pathname === '/members'
    : pathname.startsWith(href)
}

export function PortalNav({ isExec }: { isExec: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const items = isExec ? [...MEMBER_ITEMS, ...EXEC_ITEMS] : MEMBER_ITEMS

  return (
    <>
      {/* Desktop: fixed left sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col gap-1 border-r border-border p-6 md:flex">
        <Brand className="mb-6" />
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
      </aside>

      {/* Mobile: top bar with hamburger */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg-base px-4 md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          aria-expanded={open}
          className="-mr-2 flex h-10 w-10 items-center justify-center text-fg-primary"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {open && (
        <div className="md:hidden" role="dialog" aria-modal="true">
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/60"
            aria-hidden="true"
          />
          <nav className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 border-r border-border bg-bg-base p-6">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="-mr-2 flex h-10 w-10 items-center justify-center text-fg-primary"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>
        </div>
      )}
    </>
  )
}

function Brand({ className = '' }: { className?: string }) {
  return (
    <p
      translate="no"
      className={`font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary ${className}`}
    >
      VERY · MEMBERS
    </p>
  )
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center px-2 font-mono text-xs uppercase tracking-[0.28em] transition-colors ${
        active ? 'text-fg-primary' : 'text-fg-subtle hover:text-fg-primary'
      }`}
    >
      {item.label}
    </Link>
  )
}
