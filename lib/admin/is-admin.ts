import 'server-only'
import { createClient } from '@/lib/supabase/server'

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
