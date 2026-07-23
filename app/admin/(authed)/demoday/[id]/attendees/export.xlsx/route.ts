import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireAdmin } from '@/lib/admin/is-admin'
import {
  getDemodayAttendees,
  getDemodayById,
} from '@/lib/demoday/queries'

// exceljs needs the Node.js runtime (not edge).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLUMNS: { header: string; width: number }[] = [
  { header: '접수 시각', width: 20 },
  { header: '이름', width: 14 },
  { header: '소속', width: 22 },
  { header: '연락처', width: 16 },
  { header: '이메일', width: 26 },
  { header: '역할', width: 14 },
  { header: 'VERY 동문', width: 10 },
  { header: '동문 기수', width: 10 },
  { header: '뒷풀이', width: 8 },
  { header: '참가 목적', width: 30 },
  { header: '알게된 경로', width: 24 },
]

function formatCreated(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch {
    return new NextResponse('unauthorized', { status: 401 })
  }
  const { id } = await params
  const event = await getDemodayById(id)
  if (!event) return new NextResponse('not found', { status: 404 })
  const attendees = await getDemodayAttendees(id)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'VERY Admin'
  wb.created = new Date()
  const ws = wb.addWorksheet(`Vol.${event.volume} 신청자`)

  ws.columns = COLUMNS.map((c) => ({ header: c.header, width: c.width }))

  // Header styling
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A4D8A' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' }

  for (const a of attendees) {
    ws.addRow([
      formatCreated(a.created_at),
      a.name,
      a.affiliation,
      a.phone,
      a.email,
      a.role,
      a.is_very_alumni ? '예' : '아니요',
      a.very_cohort == null ? '' : String(a.very_cohort),
      a.attend_afterparty == null
        ? ''
        : a.attend_afterparty
          ? '참석'
          : '불참',
      a.purposes.join(' | '),
      a.referral_sources.join(' | '),
    ])
  }

  ws.autoFilter = { from: 'A1', to: 'K1' }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await wb.xlsx.writeBuffer()
  const filename = `demoday-vol${event.volume}-${event.semester}-attendees.xlsx`

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    headers: {
      'content-type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'cache-control': 'no-store',
    },
  })
}
