import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  PORTAL_EMAIL_HEADER,
  PORTAL_ROLE_HEADER,
} from '@/lib/portal/auth-headers'

/**
 * 역할 셋:
 *  1. members.* 호스트를 /members 라우트로 리라이트 (서브도메인 포털)
 *  2. /members 게이트 - 로그인 + portal_role(exec/member) 확인
 *  3. /admin 게이트 - 로그인 + is_admin 화이트리스트 (기존 동작)
 *
 * 포털 게이트는 확인한 신원을 x-portal-email / x-portal-role 요청 헤더로
 * 렌더에 넘긴다. 이게 없으면 페이지가 방금 미들웨어가 얻은 답을 버리고
 * 같은 인증 왕복 2회(getUser + portal_role rpc)를 다시 돈다. 메뉴 이동
 * 한 번에 왕복 4회가 돌던 지연의 절반이 이 중복이다.
 *
 * 위조 차단이 전제다: 이 두 헤더는 클라이언트가 보낼 수 있으므로, 여기서
 * 값을 채우지 않는 모든 경로에서 반드시 벗겨서 넘긴다. 한 경로라도 빠지면
 * 헤더 주입으로 포털 인가가 뚫린다. 그래서 통과 응답은 전부 아래 두 헬퍼
 * (strippedHeaders / passWithHeaders)를 거친다.
 */

/** 클라이언트가 실어 보냈을 수 있는 신원 헤더를 벗긴 요청 헤더 사본. */
function strippedHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers)
  headers.delete(PORTAL_EMAIL_HEADER)
  headers.delete(PORTAL_ROLE_HEADER)
  return headers
}

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
  return NextResponse.next({
    request: { headers: strippedHeaders(request) },
  })
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

type PendingCookie = {
  name: string
  value: string
  options?: Record<string, unknown>
}

async function membersGate(
  request: NextRequest,
  effectivePath: string,
  needsRewrite: boolean,
  isMembersHost: boolean,
) {
  // 통과 응답 생성기. identity가 있으면 신원 헤더를 채우고, 없으면 벗긴
  // 채로 넘긴다. 요청 헤더는 응답을 만드는 시점에만 실을 수 있으므로
  // (NextResponse.next({ request: { headers } })), 인증이 끝난 뒤에 응답을
  // 만들고 그동안 미뤄 둔 쿠키 갱신을 되붙이는 구조다.
  const passWithHeaders = (identity?: { email: string; role: string }) => {
    const headers = strippedHeaders(request)
    if (identity) {
      headers.set(PORTAL_EMAIL_HEADER, identity.email)
      headers.set(PORTAL_ROLE_HEADER, identity.role)
    }
    if (!needsRewrite) return NextResponse.next({ request: { headers } })
    const url = request.nextUrl.clone()
    url.pathname = effectivePath
    return NextResponse.rewrite(url, { request: { headers } })
  }

  // 로그인·콜백은 게이트 없이 통과 (신원 헤더는 벗긴다)
  if (
    effectivePath === '/members/login' ||
    effectivePath.startsWith('/members/auth')
  ) {
    return passWithHeaders()
  }

  // Supabase가 토큰 갱신으로 쓰는 쿠키를 버퍼에 모아 두었다가 최종 응답에
  // 되붙인다. 응답을 미리 만들어 쿠키를 직접 쓰게 하면, 인증 후에 요청
  // 헤더를 실은 새 응답을 만들 수 없다.
  const pendingCookies: PendingCookie[] = []
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
            pendingCookies.push({ name, value, options })
          })
        },
      },
    },
  )
  const replayCookies = <T extends NextResponse>(response: T): T => {
    pendingCookies.forEach(({ name, value, options }) =>
      response.cookies.set({ name, value, ...options }),
    )
    return response
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return replayCookies(loginRedirect(request, isMembersHost))
  }

  // 인자 없는 시그니처(0023). 함수가 세션 토큰의 이메일을 스스로 읽으므로
  // 호출자가 남의 주소를 넣어 등록 여부를 캐낼 수 없다.
  const { data: role, error } = await supabase.rpc('portal_role')
  if (error) {
    console.error('[middleware] portal_role rpc failed', error)
  }
  if (error || (role !== 'exec' && role !== 'member')) {
    return replayCookies(loginRedirect(request, isMembersHost, 'not_member'))
  }

  // 관리 화면은 임원진 전용. 학회원이 URL로 직접 접근하면 홈으로.
  // (페이지·액션의 requireExec가 2차 방어선)
  if (effectivePath.startsWith('/members/manage') && role !== 'exec') {
    const url = request.nextUrl.clone()
    url.pathname = isMembersHost ? '/' : '/members'
    url.search = ''
    return replayCookies(NextResponse.redirect(url))
  }

  return replayCookies(passWithHeaders({ email: user.email, role }))
}

async function adminGate(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname.startsWith('/admin/auth')
  ) {
    return NextResponse.next({
      request: { headers: strippedHeaders(request) },
    })
  }

  const response = NextResponse.next({
    request: { headers: strippedHeaders(request) },
  })

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
