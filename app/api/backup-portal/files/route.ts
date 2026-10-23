import { NextResponse } from 'next/server'
import { denyUnlessCron } from '@/lib/api/cron-auth'
import { supabaseService } from '@/lib/supabase/service'
import { FILES_BUCKET } from '@/lib/portal/files'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SEC = 60 * 60
const PHOTOS_BUCKET = 'portal-photos'

const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_')
/** 스토리지 객체 이름(업로드마다 새 uuid). 교체된 파일이 새 이름이 되게 한다. */
const objectName = (path: string) => path.split('/').pop() ?? path

/**
 * 포털 자산 백업용 목록. 지원자 첨부(`/api/backup-recruit/files`)가
 * 다루지 않는 나머지 전부다.
 *
 * 두 갈래로 나뉜다.
 * - 비공개 버킷: 서명 URL(1시간)을 낸다.
 *   `portal-photos`는 세션 기록 사진과 자기소개 대표사진,
 *   `portal-files`는 세션 자료, 발표 제출, 기록 첨부(녹음본·문서)다.
 *   경로는 storage.list()가 아니라 테이블에서 얻는다. list()는 기본
 *   100건에서 잘리고 반환 name에 프리픽스가 빠져 경로가 어긋난다.
 *   DB를 원본으로 삼으면 두 함정을 모두 피한다.
 * - 공개 버킷(멤버 사진, 데모데이 포스터, 파트너·동문 로고): 테이블에
 *   완성된 공개 URL이 들어 있으므로 그대로 내린다. 서명이 필요 없다.
 *
 * Apps Script는 같은 saveAs가 드라이브에 있으면 건너뛴다. 그래서 saveAs는
 * 매일 같아야 한다. 바뀌면 같은 파일을 날마다 다시 받아 드라이브와
 * Supabase Free 이그레스(월 5GB)를 함께 쓴다.
 *
 * 인증은 백업 크론 공용 CRON_SECRET Bearer.
 */
export async function GET(req: Request) {
  const denied = denyUnlessCron(req)
  if (denied) return denied

  const [posts, intros, materials, submissions] = await Promise.all([
    supabaseService
      .from('session_posts')
      .select('id, session_id, image_paths, file_paths, file_names'),
    supabaseService
      .from('member_intros')
      .select('member_id, photo_path')
      .not('photo_path', 'is', null),
    supabaseService
      .from('session_materials')
      .select('session_id, file_path, file_name'),
    supabaseService
      .from('session_submissions')
      .select('session_id, file_path, file_name'),
  ])
  const readErr =
    posts.error ?? intros.error ?? materials.error ?? submissions.error
  if (readErr) {
    console.error('[backup-portal/files] read failed', readErr)
    return new NextResponse('read failed', { status: 500 })
  }

  const slots: { bucket: string; path: string; saveAs: string }[] = []
  for (const p of posts.data ?? []) {
    const images = (p.image_paths as string[] | null) ?? []
    images.forEach((path, i) => {
      const ext = path.split('.').pop() ?? 'jpg'
      slots.push({
        bucket: PHOTOS_BUCKET,
        path,
        saveAs: safe(`${p.session_id}_${p.id}_${i + 1}.${ext}`),
      })
    })
    const files = (p.file_paths as string[] | null) ?? []
    const names = (p.file_names as string[] | null) ?? []
    files.forEach((path, i) => {
      slots.push({
        bucket: FILES_BUCKET,
        path,
        saveAs: safe(
          `post-file_${p.session_id}_${objectName(path)}_${names[i] ?? ''}`,
        ),
      })
    })
  }
  for (const it of intros.data ?? []) {
    const path = it.photo_path as string
    slots.push({
      bucket: PHOTOS_BUCKET,
      path,
      saveAs: safe(`intro_${it.member_id}_${objectName(path)}`),
    })
  }
  for (const m of materials.data ?? [])
    slots.push({
      bucket: FILES_BUCKET,
      path: m.file_path,
      saveAs: safe(
        `material_${m.session_id}_${objectName(m.file_path)}_${m.file_name}`,
      ),
    })
  for (const s of submissions.data ?? [])
    slots.push({
      bucket: FILES_BUCKET,
      path: s.file_path,
      saveAs: safe(
        `submission_${s.session_id}_${objectName(s.file_path)}_${s.file_name}`,
      ),
    })

  // 버킷마다 한 번에 서명한다. 키는 버킷과 경로를 함께 쓴다.
  const urlByKey = new Map<string, string>()
  for (const bucket of [PHOTOS_BUCKET, FILES_BUCKET]) {
    const paths = slots.filter((s) => s.bucket === bucket).map((s) => s.path)
    if (paths.length === 0) continue
    const { data, error } = await supabaseService.storage
      .from(bucket)
      .createSignedUrls(paths, SIGNED_URL_TTL_SEC)
    if (error) {
      console.error('[backup-portal/files] sign failed', bucket, error)
      return new NextResponse('sign failed', { status: 500 })
    }
    for (const d of data ?? []) {
      if (d.path && d.signedUrl) urlByKey.set(`${bucket}/${d.path}`, d.signedUrl)
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
    .map((s) => ({
      saveAs: s.saveAs,
      url: urlByKey.get(`${s.bucket}/${s.path}`) ?? null,
    }))
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
