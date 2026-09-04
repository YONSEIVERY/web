'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { getMemberByEmail, getPortalIdentityVerified } from '@/lib/portal/auth'
import { getSessionById } from '@/lib/portal/queries'
import { isSubmissionClosed } from '@/lib/portal/submission-window'
import {
  confirmUpload,
  removeFiles,
  signUpload,
  type UploadTicket,
} from '@/lib/portal/file-upload'
import type { DeleteState } from '@/app/admin/actions/delete-state'

/**
 * 발표자료 제출 액션 (학회원). 세션마다 임원진이 켠 경우에만 열린다.
 *
 * 마감(submission_due)은 제출과 티켓 발급 양쪽에서 본다. 티켓만 먼저
 * 받아 두고 마감 뒤에 확정하는 우회를 막기 위함이다. 임원진에게도
 * 예외를 두지 않는다: 마감을 미뤄야 하면 세션 설정에서 시각을 고치면
 * 되고, 예외가 있는 마감은 마감이 아니다.
 */

const MAX_TITLE_LENGTH = 200
const MAX_TEAM_LENGTH = 40
const MAX_NOTE_LENGTH = 1000

function prefixFor(sessionId: string) {
  return `submissions/${sessionId}/`
}

async function requireOpenSession(sessionId: string) {
  const identity = await getPortalIdentityVerified()
  if (!identity) throw new Error('unauthorized')
  const session = await getSessionById(sessionId)
  if (!session) throw new Error('세션을 찾을 수 없습니다.')
  if (!session.allow_submissions)
    throw new Error('제출을 받고 있지 않은 세션입니다.')
  if (isSubmissionClosed(session.submission_due))
    throw new Error('제출 마감이 지났습니다.')
  return { identity, session }
}

export async function createSubmissionUploadTicket(
  sessionId: string,
  fileName: string,
): Promise<{ ok: true; ticket: UploadTicket } | { ok: false; error: string }> {
  try {
    const { identity } = await requireOpenSession(sessionId)

    const rl = checkRateLimit(`submission:${identity.email.toLowerCase()}`, {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    })
    if (!rl.ok)
      return {
        ok: false,
        error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
      }

    const signed = await signUpload(prefixFor(sessionId), fileName)
    if (!signed.ok) return { ok: false, error: signed.error }
    return { ok: true, ticket: signed.value }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '요청에 실패했습니다.',
    }
  }
}

export async function createSessionSubmission(
  sessionId: string,
  input: {
    path: string
    fileName: string
    title: string
    teamLabel: string
    note: string
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { identity } = await requireOpenSession(sessionId)

    const confirmed = await confirmUpload(input.path, prefixFor(sessionId))
    if (!confirmed.ok) return { ok: false, error: confirmed.error }

    const member = await getMemberByEmail(identity.email)
    const submitterName = member?.name ?? identity.email.split('@')[0]

    const { error } = await supabaseService.from('session_submissions').insert({
      session_id: sessionId,
      member_id: member?.id ?? null,
      submitter_email: identity.email.toLowerCase(),
      submitter_name: submitterName,
      team_label: String(input.teamLabel ?? '').trim().slice(0, MAX_TEAM_LENGTH) || null,
      title: String(input.title ?? '').trim().slice(0, MAX_TITLE_LENGTH) || null,
      note: String(input.note ?? '').trim().slice(0, MAX_NOTE_LENGTH) || null,
      file_path: input.path,
      file_name: String(input.fileName ?? '').slice(0, 200) || 'file',
      file_size: confirmed.value.size,
    })
    if (error) {
      console.error('[createSessionSubmission] insert failed', error)
      await removeFiles([input.path])
      return { ok: false, error: '제출에 실패했습니다.' }
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

/**
 * 제출 철회. 본인 것이거나 임원진일 때만.
 *
 * 마감 뒤에도 막지 않는다. 마감 후 자기 제출을 지우면 미제출로 남지만
 * 그것은 본인의 판단이고, 잘못 올린 파일을 마감 때문에 못 내리는 쪽이
 * 더 나쁘다.
 */
export async function deleteSessionSubmission(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }

  const identity = await getPortalIdentityVerified()
  if (!identity) return { ok: false, error: '권한이 없습니다.' }

  const { data: row, error: fetchErr } = await supabaseService
    .from('session_submissions')
    .select('id, session_id, submitter_email, file_path')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) {
    console.error('[deleteSessionSubmission] fetch failed', fetchErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }
  if (!row) return { ok: false, error: '이미 삭제된 제출입니다.' }

  const isOwner =
    String(row.submitter_email).toLowerCase() === identity.email.toLowerCase()
  if (!isOwner && identity.role !== 'exec')
    return { ok: false, error: '본인 제출만 삭제할 수 있습니다.' }

  const { error: delErr } = await supabaseService
    .from('session_submissions')
    .delete()
    .eq('id', id)
  if (delErr) {
    console.error('[deleteSessionSubmission] delete failed', delErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  await removeFiles([String(row.file_path)])

  revalidatePath(`/members/sessions/${String(row.session_id)}`)
  return { ok: true, error: null }
}
