'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'

type NavItem = { href: Route; label: string }

const MEMBER_ITEMS: NavItem[] = [
  { href: '/members' as Route, label: '홈' },
  { href: '/members/people' as Route, label: '멤버' },
  { href: '/members/attendance' as Route, label: '내 출결' },
  { href: '/members/profile' as Route, label: '내 소개' },
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

  return (
    <>
      {/* Desktop: fixed left sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col gap-1 border-r border-border p-6 md:flex">
        <Brand className="mb-6" />
        <NavList isExec={isExec} pathname={pathname} />
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
            <NavList
              isExec={isExec}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </div>
      )}
    </>
  )
}

/** 학회원 공통 메뉴 + (임원진일 때) EXEC 섹션 구분 라벨과 관리 메뉴. */
function NavList({
  isExec,
  pathname,
  onNavigate,
}: {
  isExec: boolean
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <>
      {MEMBER_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href)}
          onNavigate={onNavigate}
        />
      ))}
      {isExec && (
        <>
          <p
            translate="no"
            className="mb-1 mt-6 flex items-center pl-3 font-mono text-[9px] uppercase tracking-[0.32em] text-fg-muted"
          >
            <span aria-hidden className="mr-2 inline-block h-px w-4 bg-fg-muted" />
            EXEC
          </p>
          {EXEC_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </>
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
  // 프리페치는 포인터가 올라온 링크만. 기본값(뷰포트 프리페치)이면 데스크톱
  // 사이드바 링크 4~7개가 페이지를 열 때마다 배경에서 미들웨어와 인증 왕복을
  // 태운다. 포털은 전 라우트가 force-dynamic이라 프리페치 비용이 크고, 정작
  // 탭한 순간의 진짜 요청이 그 트래픽과 경쟁한다. 모바일 드로어는 hover가
  // 없어 프리페치가 안 나가지만, staleTimes 라우터 캐시가 재방문을 덮는다.
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={item.href}
      prefetch={hovered ? null : false}
      onMouseEnter={() => setHovered(true)}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center border-l-2 pl-3 pr-2 font-mono text-xs uppercase tracking-[0.28em] transition-colors ${
        active
          ? 'border-fg-primary bg-fg-primary/[0.04] text-fg-primary'
          : 'border-transparent text-fg-subtle hover:text-fg-primary'
      }`}
    >
      {item.label}
    </Link>
  )
}
