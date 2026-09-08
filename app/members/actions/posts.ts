'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { getMemberByEmail, getPortalIdentityVerified } from '@/lib/portal/auth'
import {
  getSessionById,
  type PostAuthorScope,
} from '@/lib/portal/queries'
import { isPastDue } from '@/lib/portal/deadline'
import {
  confirmUpload,
  removeFiles,
  signUpload,
  type UploadTicket,
} from '@/lib/portal/file-upload'
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
const MAX_FILES = 5
const MAX_CONTENT_LENGTH = 5000
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

/**
 * 사진과 파일이 다른 버킷에 간다. 사진은 화면에 펼쳐 보여주므로 기존
 * portal-photos를, 녹음본·문서는 내려받기 대상이라 0033의 portal-files를
 * 쓴다. 후자는 서명 발급·확정·삭제 절차가 이미 갖춰져 있다.
 */
const FILE_PREFIX = (sessionId: string) => `assignments/${sessionId}/`

type Ticket = { path: string; token: string }

async function requirePostContext(sessionId: string) {
  const identity = await getPortalIdentityVerified()
  if (!identity) throw new Error('unauthorized')
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('세션을 찾을 수 없습니다.')
  if (!session.allow_posts) throw new Error('기록이 허용되지 않은 세션입니다.')
  // 삭제(deleteSessionPost)는 이 검사를 타지 않는다. 마감 뒤에도 잘못 올린
  // 글은 본인이 내릴 수 있어야 한다.
  if (isPastDue(session.post_due)) throw new Error('기록 마감이 지났습니다.')
  return { identity, session }
}

export async function createPostUploadTickets(
  sessionId: string,
  exts: string[],
): Promise<{ ok: true; tickets: Ticket[] } | { ok: false; error: string }> {
  try {
    const { identity, session } = await requirePostContext(sessionId)
    if (!session.post_attachments)
      return { ok: false, error: '이 회차는 글만 받습니다.' }

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

/** 녹음본·문서 첨부용 서명 티켓. 사진과 달리 portal-files로 간다. */
export async function createPostFileTicket(
  sessionId: string,
  fileName: string,
): Promise<{ ok: true; ticket: UploadTicket } | { ok: false; error: string }> {
  try {
    const { identity, session } = await requirePostContext(sessionId)
    if (!session.post_attachments)
      return { ok: false, error: '이 회차는 글만 받습니다.' }

    const rl = checkRateLimit(`post-file:${identity.email.toLowerCase()}`, {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    })
    if (!rl.ok)
      return {
        ok: false,
        error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
      }

    const res = await signUpload(FILE_PREFIX(sessionId), fileName)
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true, ticket: res.value }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '요청에 실패했습니다.',
    }
  }
}

export async function createSessionPost(
  sessionId: string,
  input: {
    contentMd: string
    imagePaths: string[]
    scope: PostAuthorScope
    teamLabel: string
    files: { path: string; fileName: string }[]
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { identity, session } = await requirePostContext(sessionId)

    const content = String(input.contentMd ?? '').trim()
    const paths = Array.isArray(input.imagePaths)
      ? input.imagePaths.map(String)
      : []
    const files = Array.isArray(input.files) ? input.files.slice(0, MAX_FILES) : []

    if (!content && paths.length === 0 && files.length === 0)
      return { ok: false, error: '내용, 사진, 파일 중 하나는 있어야 합니다.' }
    // 글 전용 회차. 티켓 발급도 막지만 저장 단계에서 한 번 더 본다.
    if (!session.post_attachments && (paths.length > 0 || files.length > 0))
      return { ok: false, error: '이 회차는 글만 받습니다.' }
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

    // 이 회차가 받기로 한 단위인지. 화면이 막고 있어도 액션이 다시 본다.
    const scope: PostAuthorScope =
      input.scope === 'team' ? 'team' : 'individual'
    if (scope === 'team' && session.post_scope === 'individual')
      return { ok: false, error: '이 회차는 개인 제출만 받습니다.' }
    if (scope === 'individual' && session.post_scope === 'team')
      return { ok: false, error: '이 회차는 조 제출만 받습니다.' }

    const teamLabel = String(input.teamLabel ?? '').trim()
    if (scope === 'team' && !session.post_teams.includes(teamLabel))
      return { ok: false, error: '조를 골라주세요.' }

    // 행을 만들기 전에 파일이 실제로 올라왔는지 확인한다. 이 단계가 없으면
    // 업로드에 실패한 채로 제출됨 표시만 남는다.
    const confirmed: { path: string; fileName: string }[] = []
    for (const f of files) {
      const res = await confirmUpload(String(f.path), FILE_PREFIX(sessionId))
      if (!res.ok) {
        await removeFiles(confirmed.map((c) => c.path))
        return { ok: false, error: res.error }
      }
      confirmed.push({ path: String(f.path), fileName: String(f.fileName) })
    }

    const member = await getMemberByEmail(identity.email)
    const authorName = member?.name ?? identity.email.split('@')[0]

    const { error } = await supabaseService.from('session_posts').insert({
      session_id: sessionId,
      member_id: member?.id ?? null,
      author_email: identity.email.toLowerCase(),
      author_name: authorName,
      content_md: content,
      image_paths: paths,
      scope,
      team_label: scope === 'team' ? teamLabel : null,
      file_paths: confirmed.map((c) => c.path),
      file_names: confirmed.map((c) => c.fileName),
    })
    if (error) {
      console.error('[createSessionPost] insert failed', error)
      await removeFiles(confirmed.map((c) => c.path))
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

  const identity = await getPortalIdentityVerified()
  if (!identity) return { ok: false, error: '권한이 없습니다.' }

  const { data: row, error: fetchErr } = await supabaseService
    .from('session_posts')
    .select('id, session_id, author_email, image_paths, file_paths')
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

  // 첨부는 다른 버킷(portal-files)이라 따로 지운다.
  const filePaths = Array.isArray(row.file_paths)
    ? (row.file_paths as unknown[]).map(String)
    : []
  await removeFiles(filePaths)

  revalidatePath(`/members/sessions/${String(row.session_id)}`)
  return { ok: true, error: null }
}
