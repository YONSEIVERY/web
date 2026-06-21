import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${url.origin}/admin/login?error=oauth_failed`)
  }
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[admin/auth/callback] exchangeCodeForSession failed', error)
      return NextResponse.redirect(`${url.origin}/admin/login?error=oauth_failed`)
    }
  } catch (err) {
    console.error('[admin/auth/callback] exchangeCodeForSession threw', err)
    return NextResponse.redirect(`${url.origin}/admin/login?error=oauth_failed`)
  }
  return NextResponse.redirect(`${url.origin}/admin`)
}
