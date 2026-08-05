import { NextResponse } from 'next/server'
import { resend, NOTIFY_TO, NOTIFY_FROM } from '@/lib/email/client'
import {
  getApplications,
  getCurrentRecruitRound,
} from '@/lib/recruit/queries'
import { buildApplicationsWorkbook } from '@/lib/recruit/export'
import { formatKstDateTime } from '@/lib/utils/format-date'

// exceljs needs the Node.js runtime (not edge).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 지원자 명단 오프사이트 백업. Vercel Cron이 매일 호출해(vercel.json)
 * 현재 라운드 지원자 엑셀을 학회 Gmail로 발송한다. DB·스토리지가 통째로
 * 잘못되어도 연락처 스냅샷이 메일함에 남는 것이 목적. 첨부 파일(지원서
 * PDF 등) 원본 백업은 범위 밖: 구글 드라이브 수동 백업으로 커버한다.
 *
 * 인증: Vercel Cron이 보내는 `Authorization: Bearer ${CRON_SECRET}` 헤더.
 * CRON_SECRET 미설정 시 fail-closed(503).
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
  const stamp = formatKstDateTime(new Date().toISOString())

  const { error } = await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    subject: `[VERY] 지원자 명단 자동 백업 · Vol.${round.cohort} · ${applications.length}명`,
    text: [
      `Vol.${round.cohort} 지원자 명단 자동 백업입니다.`,
      `기준 시각: ${stamp} (KST) · 총 ${applications.length}명`,
      '',
      '이 메일의 첨부가 오프사이트 백업본입니다. 별도 조치는 필요 없습니다.',
      '첨부 파일 원본(지원서 등)은 구글 드라이브 수동 백업으로 관리합니다.',
    ].join('\n'),
    attachments: [
      {
        filename: `backup-vol${round.cohort}-applications.xlsx`,
        content: buffer.toString('base64'),
      },
    ],
  })
  if (error) {
    console.error('[backup-recruit] send failed', error)
    return new NextResponse('send failed', { status: 500 })
  }
  return NextResponse.json({ ok: true, count: applications.length })
}
