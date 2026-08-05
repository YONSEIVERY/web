import { NextResponse } from 'next/server'
import {
  getApplications,
  getCurrentRecruitRound,
} from '@/lib/recruit/queries'
import { buildApplicationsWorkbook } from '@/lib/recruit/export'

// exceljs needs the Node.js runtime (not edge).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 지원자 명단 백업 엑셀. 학회 계정의 Apps Script가 매일 호출해 드라이브에
 * 저장한다 (첨부 파일은 ./files 참고). 서버는 드라이브 자격증명을 갖지
 * 않는 pull 구조이며, 메일 발송 단계는 두지 않는다 (실패 경고는 Apps
 * Script 쪽에서 처리).
 *
 * 인증: `Authorization: Bearer ${CRON_SECRET}`. 미설정 시 fail-closed(503).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret)
    return new NextResponse('CRON_SECRET not configured', { status: 503 })
  if (req.headers.get('authorization') !== `Bearer ${secret}`)
    return new NextResponse('unauthorized', { status: 401 })

  const round = await getCurrentRecruitRound()
  if (!round) return new NextResponse('no current round', { status: 404 })
  const applications = await getApplications(round.id)

  const buffer = await buildApplicationsWorkbook(round, applications)
  const filename = `backup-vol${round.cohort}-applications.xlsx`

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    headers: {
      'content-type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${filename}"`,
      'x-applicant-count': String(applications.length),
      'cache-control': 'no-store',
    },
  })
}
