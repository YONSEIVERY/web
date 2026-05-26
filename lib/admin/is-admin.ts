import 'server-only'
import { createClient } from '@/lib/supabase/server'

/** Middleware already gates /admin, but admin Server Actions call this for defense-in-depth. */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('unauthorized')
  // is_admin RPC not yet in generated types; regen after migration applied
  const { data: ok } = await supabase.rpc('is_admin', { check_email: user.email })
  if (!ok) throw new Error('unauthorized')
  return user.email
}
