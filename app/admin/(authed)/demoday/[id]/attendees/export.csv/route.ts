import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/is-admin'
import {
  getDemodayAttendees,
  getDemodayById,
} from '@/lib/demoday/queries'

export const dynamic = 'force-dynamic'

const HEADERS = [
  '접수 시각',
  '이름',
  '소속',
  '연락처',
  '이메일',
  '역할',
  'VERY 동문',
  '동문 기수',
  '뒷풀이',
  '참가 목적',
  '알게된 경로',
]

function csvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
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

  const rows = attendees.map((a) =>
    [
      a.created_at,
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
    ].map(csvCell),
  )
  const body = [HEADERS.map(csvCell), ...rows]
    .map((r) => r.join(','))
    .join('\n')
  // 엑셀 한글 호환을 위해 UTF-8 BOM
  const csv = '\uFEFF' + body

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="demoday-vol${event.volume}-${event.semester}-attendees.csv"`,
    },
  })
}
