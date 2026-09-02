import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import {
  PORTAL_EMAIL_HEADER,
  PORTAL_ROLE_HEADER,
} from '@/lib/portal/auth-headers'

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

// Supabase를 실제로 왕복하는 검증 경로. 서버 액션과 requireExec가 쓴다.
// React cache: 같은 요청 안에서 여러 번 불려도 왕복은 한 번이다.
export const getPortalIdentityVerified = cache(
  async (): Promise<PortalIdentity | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return null
    // 인자 없는 시그니처(0023). 세션 이메일은 함수가 직접 읽는다.
    const { data: role, error } = await supabase.rpc('portal_role')
    if (error) {
      console.error('[getPortalIdentity] portal_role rpc failed', error)
      return null
    }
    if (role !== 'exec' && role !== 'member') return null
    return { email: user.email, role }
  },
)

/**
 * 페이지·레이아웃용 신원 조회. 미들웨어가 확인해 실어 준 x-portal-* 헤더를
 * 먼저 읽고, 없을 때만 Supabase를 왕복한다. 미들웨어가 같은 요청에서 이미
 * 한 검증을 페이지가 반복하던 왕복 2회가 사라진다.
 *
 * 헤더를 신뢰할 수 있는 이유: 미들웨어가 모든 경로에서 이 헤더를 벗긴 뒤
 * 인증된 경로에서만 다시 채운다(middleware.ts). 클라이언트가 실어 보낸
 * 값은 서버에 도달하지 못한다.
 *
 * 파괴적 동작의 인가는 이 함수가 아니라 requireExec(항상 DB 검증)를 쓴다.
 */
export const getPortalIdentity = cache(
  async (): Promise<PortalIdentity | null> => {
    const h = await headers()
    const email = h.get(PORTAL_EMAIL_HEADER)
    const role = h.get(PORTAL_ROLE_HEADER)
    if (email && (role === 'exec' || role === 'member'))
      return { email, role }
    return getPortalIdentityVerified()
  },
)

export async function requireExec(): Promise<PortalIdentity> {
  // 관리 액션의 인가는 헤더 빠른 경로를 타지 않는다. 미들웨어를 신뢰하는
  // 층이 하나 늘수록 실수 반경이 커지므로, 쓰기 경로는 항상 DB로 확인한다.
  const identity = await getPortalIdentityVerified()
  if (!identity || identity.role !== 'exec') throw new Error('unauthorized')
  return identity
}

export type PortalMember = {
  id: string
  cohort: number
  name: string
}

/** 로그인 이메일과 매칭되는 학회원 행. 임원진이라도 명단에 있으면 반환. */
export const getMemberByEmail = cache(
  async (email: string): Promise<PortalMember | null> => {
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
  },
)
