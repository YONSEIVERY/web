'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { NAV_ACTIONS, NAV_ITEMS } from '@/lib/content/nav'

/**
 * Client island for nav links that need pathname awareness.
 *
 * Kept thin on purpose - the nav shell stays RSC, only the link list is
 * a client component so we can mark the current route. Active state uses
 * `aria-current="page"` plus a color flip so screen readers and sighted
 * users get the same signal.
 *
 * `variant="desktop"` renders the inline list; `variant="mobile"` renders
 * the stacked disclosure list. Both share active-detection logic so we
 * don't drift in two places.
 */
export function SiteNavLinks({
  variant,
}: {
  variant: 'desktop' | 'mobile'
}) {
  const pathname = usePathname()

  if (variant === 'desktop') {
    return (
      <div className="flex items-center gap-7 lg:gap-9">
        <ul className="flex items-center gap-7 lg:gap-9">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href as Route}
                  aria-current={active ? 'page' : undefined}
                  translate="no"
                  className={`font-mono text-[10px] uppercase tracking-[0.32em] transition-colors md:text-xs ${
                    active
                      ? 'text-fg-primary'
                      : 'text-fg-muted hover:text-fg-primary'
                  }`}
                >
                  {item.monoLabel}
                </Link>
              </li>
            )
          })}
        </ul>
        <ul className="flex items-center gap-3">
          {NAV_ACTIONS.map((item, i) => (
            <li key={item.href}>
              <Link
                href={item.href as Route}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                translate="no"
                className={`inline-flex items-center border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] transition-colors md:text-xs ${
                  i === 0
                    ? 'border-fg-primary bg-fg-primary text-bg-base hover:bg-transparent hover:text-fg-primary'
                    : 'border-border-strong text-fg-muted hover:border-fg-primary hover:text-fg-primary'
                }`}
              >
                {item.monoLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {[...NAV_ITEMS, ...NAV_ACTIONS].map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href as Route}
              aria-current={active ? 'page' : undefined}
              onClick={closeParentDisclosure}
              translate="no"
              className={`block font-mono text-[11px] uppercase tracking-[0.32em] hover:text-fg-primary ${
                active ? 'text-fg-primary' : 'text-fg-muted'
              }`}
            >
              {item.monoLabel}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function closeParentDisclosure(event: React.MouseEvent<HTMLAnchorElement>) {
  const details = event.currentTarget.closest('details')
  if (details) details.open = false
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
