import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * 어드민 인가. 등급은 두 단계다 (0032).
 *
 *  lead    : 전권. 학회장단
 *  officer : 운영 실무. 지원자 열람은 되지만 합불 변경·결과 발송·
 *            PII 반출·영구 삭제·명단 승인은 막힌다
 *
 * requireAdmin은 등급을 보지 않는다. 어드민 화면 전반과 열람 경로가
 * 쓴다. 등급이 필요한 쓰기 경로는 requireLead를 쓴다.
 */

export type AdminTier = 'lead' | 'officer'

/** Middleware already gates /admin, but admin Server Actions call this for defense-in-depth. */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('unauthorized')
  // 인자 없는 시그니처(0023). 세션 이메일은 함수가 직접 읽는다.
  const { data: ok, error } = await supabase.rpc('is_admin')
  if (error) {
    console.error('[requireAdmin] is_admin rpc failed', error)
    throw new Error('unauthorized')
  }
  if (!ok) throw new Error('unauthorized')
  return user.email
}

/**
 * 로그인한 계정의 어드민 등급. admins에 없거나 판정에 실패하면 null.
 *
 * 실패를 null로 떨어뜨리는 것이 핵심이다. 호출자는 'lead'인지만 물으므로,
 * RPC가 깨지면 권한이 열리는 쪽이 아니라 닫히는 쪽으로 간다. 마이그레이션
 * 0032가 아직 안 걸린 환경에서도 어드민이 잠기지 않고 lead 전용 기능만
 * 사라진다.
 *
 * React cache: 한 요청 안에서 여러 LeadOnly가 물어도 왕복은 한 번이다.
 */
export const getAdminTier = cache(async (): Promise<AdminTier | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null
  // 인자 없는 시그니처. 호출자는 자기 등급만 물을 수 있다 (0032).
  const { data, error } = await supabase.rpc('admin_tier')
  if (error) {
    console.error('[getAdminTier] admin_tier rpc failed', error)
    return null
  }
  if (data === 'lead') return 'lead'
  if (data === 'officer') return 'officer'
  return null
})

/** lead 전용 경로의 인가. 화면에서 버튼을 숨기는 것과 별개인 실제 방어선이다. */
export async function requireLead(): Promise<string> {
  const email = await requireAdmin()
  const tier = await getAdminTier()
  if (tier !== 'lead') throw new Error('unauthorized')
  return email
}
