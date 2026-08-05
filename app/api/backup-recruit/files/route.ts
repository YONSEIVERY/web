import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'
import {
  getApplications,
  getCurrentRecruitRound,
} from '@/lib/recruit/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SEC = 60 * 60

/**
 * 첨부 파일 백업용 목록. 현재 라운드 전체 첨부(지원서·계획서·작업물)의
 * 서명 URL(1시간)을 내준다. 학회 계정의 Apps Script가 매일 호출해 파일을
 * 드라이브로 내려받는다 (서버는 드라이브 권한을 갖지 않는 pull 구조).
 * 인증: 백업 크론과 같은 CRON_SECRET Bearer.
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

  const slots = applications.flatMap((a) => {
    const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_')
    const items: { path: string; saveAs: string }[] = [
      { path: a.file_path, saveAs: safe(`${a.name}_${a.file_name}`) },
    ]
    if (a.business_plan_path)
      items.push({
        path: a.business_plan_path,
        saveAs: safe(`${a.name}_${a.business_plan_name ?? '사업계획서'}`),
      })
    if (a.portfolio_path)
      items.push({
        path: a.portfolio_path,
        saveAs: safe(`${a.name}_${a.portfolio_name ?? '작업물.zip'}`),
      })
    return items
  })

  const urlByPath = new Map<string, string>()
  if (slots.length > 0) {
    const { data, error } = await supabaseService.storage
      .from('recruit-applications')
      .createSignedUrls(
        slots.map((s) => s.path),
        SIGNED_URL_TTL_SEC,
      )
    if (error) {
      console.error('[backup-recruit/files] sign failed', error)
      return new NextResponse('sign failed', { status: 500 })
    }
    for (const d of data ?? []) {
      if (d.path && d.signedUrl) urlByPath.set(d.path, d.signedUrl)
    }
  }

  return NextResponse.json({
    cohort: round.cohort,
    count: slots.length,
    files: slots
      .map((s) => ({ saveAs: s.saveAs, url: urlByPath.get(s.path) ?? null }))
      .filter((f) => f.url !== null),
  })
}
