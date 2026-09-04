'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { requireExec } from '@/lib/portal/auth'
import { getSessionById } from '@/lib/portal/queries'
import {
  confirmUpload,
  removeFiles,
  signUpload,
  type UploadTicket,
} from '@/lib/portal/file-upload'
import type { DeleteState } from '@/app/admin/actions/delete-state'

/**
 * 세션 자료 액션 (임원진 전용). 세션 안내글에 붙는 파일을 다룬다.
 *
 * 학회원 제출(submissions.ts)과 흐름은 같지만 인가가 다르다. 이쪽은
 * 전부 requireExec이고, 저장 경로 프리픽스도 분리해 두 방향의 파일이
 * 서로의 경로를 참조하지 못하게 한다.
 */

const MAX_MATERIALS = 20
const MAX_LABEL_LENGTH = 120

function prefixFor(sessionId: string) {
  return `materials/${sessionId}/`
}

export async function createMaterialUploadTicket(
  sessionId: string,
  fileName: string,
): Promise<{ ok: true; ticket: UploadTicket } | { ok: false; error: string }> {
  try {
    const identity = await requireExec()
    const session = await getSessionById(sessionId)
    if (!session) return { ok: false, error: '세션을 찾을 수 없습니다.' }

    const rl = checkRateLimit(`material-upload:${identity.email.toLowerCase()}`, {
      limit: 60,
      windowMs: 60 * 60 * 1000,
    })
    if (!rl.ok)
      return {
        ok: false,
        error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
      }

    const { count } = await supabaseService
      .from('session_materials')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
    if ((count ?? 0) >= MAX_MATERIALS)
      return {
        ok: false,
        error: `자료는 세션당 ${MAX_MATERIALS}개까지 올릴 수 있습니다.`,
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

export async function addSessionMaterial(
  sessionId: string,
  path: string,
  fileName: string,
  label: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const identity = await requireExec()
    const session = await getSessionById(sessionId)
    if (!session) return { ok: false, error: '세션을 찾을 수 없습니다.' }

    const confirmed = await confirmUpload(path, prefixFor(sessionId))
    if (!confirmed.ok) return { ok: false, error: confirmed.error }

    const trimmedLabel = String(label ?? '').trim().slice(0, MAX_LABEL_LENGTH)
    const { error } = await supabaseService.from('session_materials').insert({
      session_id: sessionId,
      file_path: path,
      file_name: String(fileName ?? '').slice(0, 200) || 'file',
      file_size: confirmed.value.size,
      label: trimmedLabel || null,
      uploaded_by: identity.email.toLowerCase(),
    })
    if (error) {
      console.error('[addSessionMaterial] insert failed', error)
      // 행이 없는 파일은 아무도 닿을 수 없다. 남겨 두면 용량만 먹는다.
      await removeFiles([path])
      return { ok: false, error: '자료 저장에 실패했습니다.' }
    }

    revalidatePath(`/members/sessions/${sessionId}`)
    revalidatePath(`/members/manage/sessions/${sessionId}`)
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '요청에 실패했습니다.',
    }
  }
}

export async function deleteSessionMaterial(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }

  try {
    await requireExec()
  } catch {
    return { ok: false, error: '권한이 없습니다.' }
  }

  const { data: row, error: fetchErr } = await supabaseService
    .from('session_materials')
    .select('id, session_id, file_path')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) {
    console.error('[deleteSessionMaterial] fetch failed', fetchErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }
  if (!row) return { ok: false, error: '이미 삭제된 자료입니다.' }

  const { error: delErr } = await supabaseService
    .from('session_materials')
    .delete()
    .eq('id', id)
  if (delErr) {
    console.error('[deleteSessionMaterial] delete failed', delErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  await removeFiles([String(row.file_path)])

  const sessionId = String(row.session_id)
  revalidatePath(`/members/sessions/${sessionId}`)
  revalidatePath(`/members/manage/sessions/${sessionId}`)
  return { ok: true, error: null }
}
