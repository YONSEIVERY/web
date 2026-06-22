import type { Metadata } from 'next'
import Link from 'next/link'
import type { Route } from 'next'

export const metadata: Metadata = {
  title: 'VERY · Admin',
  robots: 'noindex',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <aside className="fixed inset-y-0 left-0 w-56 border-r border-border p-6 flex flex-col gap-1">
        <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary mb-6">
          VERY · ADMIN
        </p>
        <NavLink href="/admin">대시보드</NavLink>
        <NavLink href="/admin/applications">신청 큐</NavLink>
        <NavLink href="/admin/inquiries">문의</NavLink>
        <NavLink href="/admin/alumni">알럼나이</NavLink>
        <NavLink href="/admin/partners">파트너</NavLink>
        <NavLink href="/admin/demoday">데모데이</NavLink>
      </aside>
      <main className="ml-56 p-10">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as Route}
      className="font-mono text-xs uppercase tracking-[0.28em] text-fg-subtle hover:text-fg-primary px-2 py-2"
    >
      {children}
    </Link>
  )
}
