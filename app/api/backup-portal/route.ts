import { NextResponse } from 'next/server'
import { denyUnlessCron } from '@/lib/api/cron-auth'
import { buildPortalDump } from '@/lib/portal/backup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 포털 전 테이블 백업 덤프(JSON). 학회 계정의 Apps Script가 매일 호출해
 * 드라이브에 저장한다. 지원자 백업(`/api/backup-recruit`)이 사람이 읽는
 * 엑셀인 것과 달리 이쪽은 복원이 목적이라 원본 그대로의 JSON이다.
 *
 * 이 프로젝트는 Supabase Free 플랜이라 플랫폼 자동 백업이 없다. 사고가
 * 나면 이 덤프가 유일한 복원 지점이다.
 *
 * 서버는 드라이브 자격증명을 갖지 않는 pull 구조이며, 실패 경고는 Apps
 * Script 쪽에서 처리한다. 인증은 백업 크론 공용 CRON_SECRET Bearer.
 *
 * 응답 헤더로 건수를 병기해 Apps Script가 본문을 파싱하지 않고도
 * 이상(0건, 급감, 부분 실패)을 감지할 수 있게 한다.
 */
export async function GET(req: Request) {
  const denied = denyUnlessCron(req)
  if (denied) return denied

  const dump = await buildPortalDump()
  const filename = `backup-portal-${dump.takenAt.slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(dump), {
    // 부분 실패도 200으로 내린다. 받은 만큼은 저장되어야 한다.
    // 이상 감지는 아래 헤더로 한다.
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'x-total-rows': String(dump.totalRows),
      'x-table-count': String(Object.keys(dump.tables).length),
      'x-failed-count': String(dump.failed.length),
      'cache-control': 'no-store',
    },
  })
}
