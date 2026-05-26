import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname.startsWith('/admin/auth')) {
    return NextResponse.next()
  }

  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // is_admin RPC not yet in generated types; regen after migration applied
  const { data: ok, error } = await supabase.rpc('is_admin', { check_email: user.email })
  if (error || !ok) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
