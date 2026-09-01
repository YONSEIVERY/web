import 'server-only'
import { NextResponse } from 'next/server'

/**
 * 백업 크론 엔드포인트 공용 인증. `Authorization: Bearer ${CRON_SECRET}`.
 * 시크릿 미설정이면 fail-closed(503)로 막는다. 열려 있는 편이 위험하다.
 *
 * 통과하면 null, 막히면 그대로 반환할 응답을 돌려준다.
 */
export function denyUnlessCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret)
    return new NextResponse('CRON_SECRET not configured', { status: 503 })
  if (req.headers.get('authorization') !== `Bearer ${secret}`)
    return new NextResponse('unauthorized', { status: 401 })
  return null
}
