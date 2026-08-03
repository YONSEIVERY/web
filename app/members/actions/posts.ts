'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import { getSessionById } from '@/lib/portal/queries'
import type { DeleteState } from '@/app/admin/actions/delete-state'

/**
 * 학회원 포스트 액션. 사진은 Vercel 요청 본문 4.5MB 제한을 피하기 위해
 * 서버를 거치지 않는다: 서버는 서명 업로드 티켓만 발급하고, 브라우저가
 * supabase-js로 스토리지에 직접 올린 뒤 경로만 제출한다.
 *
 * 경로 검증이 핵심 방어선: 티켓 발급과 포스트 저장 모두
 * `posts/{sessionId}/` 프리픽스를 강제해, 남의 세션·남의 버킷 경로를
 * 참조하거나 덮어쓸 수 없게 한다.
 */

const BUCKET = 'portal-photos'
const MAX_IMAGES = 6
const MAX_CONTENT_LENGTH = 5000
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

type Ticket = { path: string; token: string }

async function requirePostContext(sessionId: string) {
  const identity = await getPortalIdentity()
  if (!identity) throw new Error('unauthorized')
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('세션을 찾을 수 없습니다.')
  if (!session.allow_posts) throw new Error('기록이 허용되지 않은 세션입니다.')
  return { identity, session }
}

export async function createPostUploadTickets(
  sessionId: string,
  exts: string[],
): Promise<{ ok: true; tickets: Ticket[] } | { ok: false; error: string }> {
  try {
    const { identity } = await requirePostContext(sessionId)

    if (!Array.isArray(exts) || exts.length === 0)
      return { ok: false, error: '업로드할 파일이 없습니다.' }
    if (exts.length > MAX_IMAGES)
      return { ok: false, error: `사진은 최대 ${MAX_IMAGES}장까지입니다.` }
    if (exts.some((e) => !IMAGE_EXTS.has(String(e).toLowerCase())))
      return { ok: false, error: 'JPG/PNG/WEBP/GIF만 업로드할 수 있습니다.' }

    const rl = checkRateLimit(`post-upload:${identity.email.toLowerCase()}`, {
      limit: 60,
      windowMs: 60 * 60 * 1000,
    })
    if (!rl.ok)
      return {
        ok: false,
        error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
      }

    const tickets: Ticket[] = []
    for (const ext of exts) {
      const path = `posts/${sessionId}/${crypto.randomUUID()}.${String(ext).toLowerCase()}`
      const { data, error } = await supabaseService.storage
        .from(BUCKET)
        .createSignedUploadUrl(path)
      if (error || !data) {
        console.error('[createPostUploadTickets] sign failed', error)
        return { ok: false, error: '업로드 준비에 실패했습니다.' }
      }
      tickets.push({ path: data.path, token: data.token })
    }
    return { ok: true, tickets }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '요청에 실패했습니다.',
    }
  }
}

export async function createSessionPost(
  sessionId: string,
  contentMd: string,
  imagePaths: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { identity } = await requirePostContext(sessionId)

    const content = String(contentMd ?? '').trim()
    const paths = Array.isArray(imagePaths) ? imagePaths.map(String) : []
    if (!content && paths.length === 0)
      return { ok: false, error: '내용이나 사진 중 하나는 있어야 합니다.' }
    if (content.length > MAX_CONTENT_LENGTH)
      return {
        ok: false,
        error: `내용은 ${MAX_CONTENT_LENGTH}자 이하로 작성해주세요.`,
      }
    if (paths.length > MAX_IMAGES)
      return { ok: false, error: `사진은 최대 ${MAX_IMAGES}장까지입니다.` }
    const prefix = `posts/${sessionId}/`
    if (paths.some((p) => !p.startsWith(prefix) || p.includes('..')))
      return { ok: false, error: '사진 경로가 올바르지 않습니다.' }

    const member = await getMemberByEmail(identity.email)
    const authorName = member?.name ?? identity.email.split('@')[0]

    const { error } = await supabaseService.from('session_posts').insert({
      session_id: sessionId,
      member_id: member?.id ?? null,
      author_email: identity.email.toLowerCase(),
      author_name: authorName,
      content_md: content,
      image_paths: paths,
    })
    if (error) {
      console.error('[createSessionPost] insert failed', error)
      return { ok: false, error: '저장에 실패했습니다.' }
    }
    revalidatePath(`/members/sessions/${sessionId}`)
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '요청에 실패했습니다.',
    }
  }
}

export async function deleteSessionPost(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }

  const identity = await getPortalIdentity()
  if (!identity) return { ok: false, error: '권한이 없습니다.' }

  const { data: row, error: fetchErr } = await supabaseService
    .from('session_posts')
    .select('id, session_id, author_email, image_paths')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) {
    console.error('[deleteSessionPost] fetch failed', fetchErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }
  if (!row) return { ok: false, error: '이미 삭제된 글입니다.' }

  const isOwner =
    String(row.author_email).toLowerCase() === identity.email.toLowerCase()
  if (!isOwner && identity.role !== 'exec')
    return { ok: false, error: '본인 글만 삭제할 수 있습니다.' }

  const { error: delErr } = await supabaseService
    .from('session_posts')
    .delete()
    .eq('id', id)
  if (delErr) {
    console.error('[deleteSessionPost] delete failed', delErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  const paths = Array.isArray(row.image_paths)
    ? (row.image_paths as unknown[]).map(String)
    : []
  if (paths.length > 0) {
    try {
      const { error: rmErr } = await supabaseService.storage
        .from(BUCKET)
        .remove(paths)
      if (rmErr) console.error('[deleteSessionPost] photo cleanup failed', rmErr)
    } catch (rmErr) {
      console.error('[deleteSessionPost] photo cleanup threw', rmErr)
    }
  }

  revalidatePath(`/members/sessions/${String(row.session_id)}`)
  return { ok: true, error: null }
}
