import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/admin-nav'

export const metadata: Metadata = {
  title: 'VERY · Admin',
  robots: 'noindex',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <AdminNav />
      <main className="px-4 pb-16 pt-20 md:ml-56 md:p-10">{children}</main>
    </div>
  )
}
