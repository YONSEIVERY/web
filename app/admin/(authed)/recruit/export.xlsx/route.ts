import { NextResponse } from 'next/server'
import { requireLead } from '@/lib/admin/is-admin'
import {
  getApplications,
  getCurrentRecruitRound,
  getRecruitRoundById,
} from '@/lib/recruit/queries'
import { buildApplicationsWorkbook } from '@/lib/recruit/export'

// exceljs needs the Node.js runtime (not edge).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    await requireLead()
  } catch {
    return new NextResponse('unauthorized', { status: 401 })
  }
  const roundId = new URL(req.url).searchParams.get('round')
  const round = roundId
    ? await getRecruitRoundById(roundId)
    : await getCurrentRecruitRound()
  if (!round) return new NextResponse('not found', { status: 404 })
  const applications = await getApplications(round.id)

  const buffer = await buildApplicationsWorkbook(round, applications)
  const filename = `recruit-vol${round.cohort}-applications.xlsx`

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    headers: {
      'content-type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'cache-control': 'no-store',
    },
  })
}
