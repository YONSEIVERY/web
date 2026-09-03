import { getAdminTier } from '@/lib/admin/is-admin'

/**
 * lead 등급에게만 보이는 블록 (0032).
 *
 * 서버에서 등급을 확인하므로 officer의 브라우저에는 마크업 자체가 내려가지
 * 않는다. 실제 인가는 서버 액션의 requireLead가 하고, 이 컴포넌트는 누를 수
 * 없는 버튼을 보여 주지 않기 위한 것이다. 둘 중 하나만 있으면 안 된다:
 * 화면만 숨기면 액션 직접 호출로 뚫리고, 액션만 막으면 officer가 버튼을
 * 누른 뒤 권한 오류를 보게 된다.
 *
 * fallback은 자리를 비워 두면 화면이 어색해지는 곳에만 쓴다 (안내 문구 등).
 */
export async function LeadOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const tier = await getAdminTier()
  return <>{tier === 'lead' ? children : fallback}</>
}
