import 'server-only'
import ExcelJS from 'exceljs'
import { formatKstDateTime } from '@/lib/utils/format-date'
import {
  APPLICATION_STATUS_LABELS,
  type Application,
  type RecruitRound,
} from '@/lib/recruit/queries'

/**
 * 지원자 명단 엑셀 생성. 어드민 다운로드와 자동 백업 메일이 공유한다.
 * 컬럼을 바꾸면 두 소비처가 함께 바뀌는 것이 의도.
 */

const COLUMNS: { header: string; width: number }[] = [
  { header: '접수 시각', width: 20 },
  { header: '이름', width: 14 },
  { header: '연락처', width: 16 },
  { header: '이메일', width: 26 },
  { header: '지원서 파일명', width: 28 },
  { header: '사업계획서', width: 24 },
  { header: '작업물', width: 24 },
  { header: '비대면 면접 사유', width: 40 },
  { header: '상태', width: 12 },
]

export async function buildApplicationsWorkbook(
  round: RecruitRound,
  applications: Application[],
): Promise<Buffer> {
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
      formatKstDateTime(a.created_at),
      a.name,
      a.phone,
      a.email,
      a.file_name,
      a.business_plan_name ?? '',
      a.portfolio_name ?? '',
      a.remote_interview_reason ?? '',
      APPLICATION_STATUS_LABELS[a.status],
    ])
  }

  ws.autoFilter = { from: 'A1', to: 'I1' }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
