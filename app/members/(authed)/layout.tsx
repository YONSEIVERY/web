import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPortalIdentity } from '@/lib/portal/auth'
import { PortalNav } from '@/components/portal/portal-nav'

export const metadata: Metadata = {
  title: '학회원 포털',
  robots: 'noindex',
}

/**
 * 포털 공통 셸. 미들웨어가 1차 게이트지만 레이아웃에서도 재확인한다
 * (리라이트 우회 등 엣지 대비). 임원진(exec)에게만 관리 메뉴 노출.
 */
export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const identity = await getPortalIdentity()
  if (!identity) redirect('/members/login')

  return (
    <div className="min-h-dvh bg-bg-base">
      <PortalNav isExec={identity.role === 'exec'} />
      <main className="px-4 pb-16 pt-20 md:ml-56 md:p-10">{children}</main>
    </div>
  )
}
