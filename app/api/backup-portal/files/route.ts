import { NextResponse } from 'next/server'
import { denyUnlessCron } from '@/lib/api/cron-auth'
import { supabaseService } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SEC = 60 * 60
const PORTAL_BUCKET = 'portal-photos'

const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_')

/**
 * 포털 자산 백업용 목록. 지원자 첨부(`/api/backup-recruit/files`)가
 * 다루지 않는 나머지 전부다.
 *
 * 두 갈래로 나뉜다.
 * - 비공개 버킷 `portal-photos`(세션 기록 사진): 서명 URL(1시간)을 낸다.
 *   경로는 storage.list()가 아니라 `session_posts.image_paths`에서 얻는다.
 *   list()는 기본 100건에서 잘리고 반환 name에 프리픽스가 빠져 경로가
 *   어긋난다. DB를 원본으로 삼으면 두 함정을 모두 피한다.
 * - 공개 버킷(멤버 사진, 데모데이 포스터, 파트너·동문 로고): 테이블에
 *   완성된 공개 URL이 들어 있으므로 그대로 내린다. 서명이 필요 없다.
 *
 * 인증은 백업 크론 공용 CRON_SECRET Bearer.
 */
export async function GET(req: Request) {
  const denied = denyUnlessCron(req)
  if (denied) return denied

  // 비공개: 세션 기록 사진
  const { data: posts, error: postsErr } = await supabaseService
    .from('session_posts')
    .select('id, session_id, image_paths')

  if (postsErr) {
    console.error('[backup-portal/files] posts read failed', postsErr)
    return new NextResponse('read failed', { status: 500 })
  }

  const slots: { path: string; saveAs: string }[] = []
  for (const p of posts ?? []) {
    const paths = (p.image_paths as string[] | null) ?? []
    paths.forEach((path, i) => {
      const ext = path.split('.').pop() ?? 'jpg'
      slots.push({
        path,
        saveAs: safe(`${p.session_id}_${p.id}_${i + 1}.${ext}`),
      })
    })
  }

  const urlByPath = new Map<string, string>()
  if (slots.length > 0) {
    const { data, error } = await supabaseService.storage
      .from(PORTAL_BUCKET)
      .createSignedUrls(
        slots.map((s) => s.path),
        SIGNED_URL_TTL_SEC,
      )
    if (error) {
      console.error('[backup-portal/files] sign failed', error)
      return new NextResponse('sign failed', { status: 500 })
    }
    for (const d of data ?? []) {
      if (d.path && d.signedUrl) urlByPath.set(d.path, d.signedUrl)
    }
  }

  // 공개: 테이블에 저장된 공개 URL을 그대로 모은다
  const publicFiles: { saveAs: string; url: string }[] = []
  const addPublic = (prefix: string, key: string, url: unknown) => {
    if (typeof url !== 'string' || !url) return
    const ext = (url.split('?')[0] ?? url).split('.').pop() ?? 'png'
    publicFiles.push({ saveAs: safe(`${prefix}_${key}.${ext}`), url })
  }

  const [members, events, partners, companies] = await Promise.all([
    supabaseService.from('cohort_members').select('id, cohort, photo_url'),
    supabaseService
      .from('demoday_events')
      .select('id, poster_url, group_photo_url'),
    supabaseService
      .from('partners')
      .select('id, logo_url, marquee_logo_url'),
    supabaseService.from('alumni_companies').select('id, logo_url'),
  ])

  for (const m of members.data ?? [])
    addPublic('member', `${m.cohort}_${m.id}`, m.photo_url)
  for (const e of events.data ?? []) {
    addPublic('demoday-poster', e.id, e.poster_url)
    addPublic('demoday-group', e.id, e.group_photo_url)
  }
  for (const p of partners.data ?? []) {
    addPublic('partner', p.id, p.logo_url)
    addPublic('partner-marquee', p.id, p.marquee_logo_url)
  }
  for (const c of companies.data ?? [])
    addPublic('alumni-company', c.id, c.logo_url)

  const signed = slots
    .map((s) => ({ saveAs: s.saveAs, url: urlByPath.get(s.path) ?? null }))
    .filter((f): f is { saveAs: string; url: string } => f.url !== null)

  return NextResponse.json({
    count: signed.length + publicFiles.length,
    // 서명에 실패한 항목은 위에서 걸러진다. 시도한 수를 함께 내려야
    // 호출부가 "원래 몇 개였는데 몇 개가 빠졌는지"를 알 수 있다.
    // 이것이 없으면 사진이 조용히 백업에서 사라져도 아무도 모른다.
    signedExpected: slots.length,
    signedCount: signed.length,
    publicCount: publicFiles.length,
    files: [...signed, ...publicFiles],
  })
}
