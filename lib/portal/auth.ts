import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 포털 인가. 미들웨어가 1차 게이트지만, 서버 액션과 페이지는 이 헬퍼로
 * 방어를 한 겹 더 둔다 (admin의 requireAdmin 관행과 동일).
 *
 *  exec   : admins 화이트리스트 (임원진) - 세션/공지/출결 관리 가능
 *  member : cohort_members 등록 이메일 (학회원) - 열람 + 본인 출결 조회
 */

export type PortalRole = 'exec' | 'member'

export type PortalIdentity = {
  email: string
  role: PortalRole
}

export async function getPortalIdentity(): Promise<PortalIdentity | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null
  const { data: role, error } = await supabase.rpc('portal_role', {
    check_email: user.email,
  })
  if (error) {
    console.error('[getPortalIdentity] portal_role rpc failed', error)
    return null
  }
  if (role !== 'exec' && role !== 'member') return null
  return { email: user.email, role }
}

export async function requireExec(): Promise<PortalIdentity> {
  const identity = await getPortalIdentity()
  if (!identity || identity.role !== 'exec') throw new Error('unauthorized')
  return identity
}

export type PortalMember = {
  id: string
  cohort: number
  name: string
}

/** 로그인 이메일과 매칭되는 학회원 행. 임원진이라도 명단에 있으면 반환. */
export async function getMemberByEmail(
  email: string,
): Promise<PortalMember | null> {
  const { data } = await supabaseService
    .from('cohort_members')
    .select('id, cohort, name')
    .ilike('email', email)
    .order('cohort', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return {
    id: String(data.id),
    cohort: Number(data.cohort),
    name: String(data.name),
  }
}
