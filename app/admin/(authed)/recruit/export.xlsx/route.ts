import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireAdmin } from '@/lib/admin/is-admin'
import {
  getApplications,
  getCurrentRecruitRound,
  getRecruitRoundById,
  APPLICATION_STATUS_LABELS,
} from '@/lib/recruit/queries'

// exceljs needs the Node.js runtime (not edge).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLUMNS: { header: string; width: number }[] = [
  { header: '접수 시각', width: 20 },
  { header: '이름', width: 14 },
  { header: '연락처', width: 16 },
  { header: '이메일', width: 26 },
  { header: '지원서 파일명', width: 28 },
  { header: '비대면 면접 사유', width: 40 },
  { header: '상태', width: 12 },
]

function formatCreated(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function GET(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return new NextResponse('unauthorized', { status: 401 })
  }
  const roundId = new URL(req.url).searchParams.get('round')
  const round = roundId
    ? await getRecruitRoundById(roundId)
    : await getCurrentRecruitRound()
  if (!round) return new NextResponse('not found', { status: 404 })
  const applications = await getApplications(round.id)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'VERY Admin'
  wb.created = new Date()
  const ws = wb.addWorksheet(`Vol.${round.cohort} 지원자`)

  ws.columns = COLUMNS.map((c) => ({ header: c.header, width: c.width }))

  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A4D8A' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' }

  for (const a of applications) {
    ws.addRow([
      formatCreated(a.created_at),
      a.name,
      a.phone,
      a.email,
      a.file_name,
      a.remote_interview_reason ?? '',
      APPLICATION_STATUS_LABELS[a.status],
    ])
  }

  ws.autoFilter = { from: 'A1', to: 'G1' }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await wb.xlsx.writeBuffer()
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
