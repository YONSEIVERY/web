import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * 역할 셋:
 *  1. members.* 호스트를 /members 라우트로 리라이트 (서브도메인 포털)
 *  2. /members 게이트 - 로그인 + portal_role(exec/member) 확인
 *  3. /admin 게이트 - 로그인 + is_admin 화이트리스트 (기존 동작)
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isMembersHost = host.startsWith('members.')
  const rawPath = request.nextUrl.pathname

  // 서브도메인은 /members 프리픽스 없이 접근한다. members.yonseivery.com/x
  // → 내부적으로 /members/x. (이미 /members로 시작하면 그대로 둔다.)
  const needsRewrite = isMembersHost && !rawPath.startsWith('/members')
  const effectivePath = needsRewrite
    ? `/members${rawPath === '/' ? '' : rawPath}`
    : rawPath

  if (effectivePath.startsWith('/admin')) {
    return adminGate(request)
  }
  if (effectivePath.startsWith('/members')) {
    return membersGate(request, effectivePath, needsRewrite, isMembersHost)
  }
  return NextResponse.next()
}

function loginRedirect(
  request: NextRequest,
  isMembersHost: boolean,
  error?: string,
) {
  const url = request.nextUrl.clone()
  // 서브도메인에서는 리라이트가 /members를 붙이므로 외부 경로는 /login.
  url.pathname = isMembersHost ? '/login' : '/members/login'
  url.search = ''
  if (error) url.searchParams.set('error', error)
  return NextResponse.redirect(url)
}

async function membersGate(
  request: NextRequest,
  effectivePath: string,
  needsRewrite: boolean,
  isMembersHost: boolean,
) {
  const pass = () => {
    if (!needsRewrite) return NextResponse.next({ request })
    const url = request.nextUrl.clone()
    url.pathname = effectivePath
    return NextResponse.rewrite(url, { request })
  }

  // 로그인·콜백은 게이트 없이 통과
  if (
    effectivePath === '/members/login' ||
    effectivePath.startsWith('/members/auth')
  ) {
    return pass()
  }

  const response = pass()
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
    return loginRedirect(request, isMembersHost)
  }

  // 인자 없는 시그니처(0023). 함수가 세션 토큰의 이메일을 스스로 읽으므로
  // 호출자가 남의 주소를 넣어 등록 여부를 캐낼 수 없다.
  const { data: role, error } = await supabase.rpc('portal_role')
  if (error) {
    console.error('[middleware] portal_role rpc failed', error)
  }
  if (error || !role) {
    return loginRedirect(request, isMembersHost, 'not_member')
  }

  // 관리 화면은 임원진 전용. 학회원이 URL로 직접 접근하면 홈으로.
  // (페이지·액션의 requireExec가 2차 방어선)
  if (effectivePath.startsWith('/members/manage') && role !== 'exec') {
    const url = request.nextUrl.clone()
    url.pathname = isMembersHost ? '/' : '/members'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

async function adminGate(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname.startsWith('/admin/auth')
  ) {
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

  // 인자 없는 시그니처(0023). 세션 이메일은 함수가 직접 읽는다.
  const { data: ok, error } = await supabase.rpc('is_admin')
  if (error) {
    console.error('[middleware] is_admin rpc failed', error)
  }
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
  // 정적 자산·파일 확장자를 제외한 전 경로. members.* 호스트 리라이트를
  // 위해 마케팅 경로에서도 실행되지만, 호스트 확인 후 즉시 통과라 비용은 미미.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)'],
}
