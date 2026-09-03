import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/admin-nav'
import { getAdminTier } from '@/lib/admin/is-admin'

export const metadata: Metadata = {
  title: '어드민',
  robots: 'noindex',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 등급을 화면에 드러내지 않으면 officer는 버튼이 없는 이유를 알 수 없어
  // 고장으로 읽는다 (0032).
  const tier = await getAdminTier()
  return (
    <div className="min-h-screen bg-bg-base">
      <AdminNav tier={tier} />
      <main className="px-4 pb-16 pt-20 md:ml-56 md:p-10">{children}</main>
    </div>
  )
}
