import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * 쿠키를 읽지 않는 익명 읽기 전용 클라이언트.
 *
 * lib/supabase/server.ts의 createClient는 cookies()를 부르므로, 그것을 쓰는
 * 순간 페이지가 요청마다 동적 렌더로 떨어진다. 푸터의 getSiteConfig 한 줄
 * 때문에 공개 사이트 전체가 CDN 캐시 0으로 살았고, 실측 TTFB가 1.5초였다.
 *
 * 공개 데이터(site_config, partners)는 로그인과 무관하므로 이 클라이언트로
 * 읽는다. anon 키라 RLS가 그대로 적용된다. service_role을 공개 경로에
 * 끌어들이지 않는 것이 원칙이다.
 */
export const supabaseAnon = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
)
