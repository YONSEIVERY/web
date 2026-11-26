'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireLead } from '@/lib/admin/is-admin'
import { getMemberByEmail } from '@/lib/portal/auth'
import type { DeleteState } from '@/app/admin/actions/delete-state'

/**
 * 발표자료 피드백 액션 (0037 submission_feedback).
 *
 * 쓰기와 삭제는 lead(학회장단)만이다. 화면에서 폼을 숨기는 것과 별개로
 * 여기서 requireLead가 DB로 다시 확인한다. 작성자는 로그인 이메일에서
 * 복사하므로 폼으로 사칭할 수 없다.
 */

const MAX_BODY = 2000
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

async function leadEmailOrNull(): Promise<string | null> {
  try {
    return await requireLead()
  } catch {
    return null
  }
}

export async function createSubmissionFeedback(
  submissionId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = await leadEmailOrNull()
  if (!email) return { ok: false, error: '학회장단만 피드백을 쓸 수 있습니다.' }
  if (!UUID_RE.test(String(submissionId)))
    return { ok: false, error: '잘못된 요청입니다.' }

  const content = String(body ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  if (!content) return { ok: false, error: '내용을 입력해주세요.' }
  if (content.length > MAX_BODY)
    return {
      ok: false,
      error: `피드백은 ${MAX_BODY.toLocaleString()}자 이하로 적어주세요.`,
    }

  const { data: sub, error: subErr } = await supabaseService
    .from('session_submissions')
    .select('session_id')
    .eq('id', submissionId)
    .maybeSingle()
  if (subErr) {
    console.error('[createSubmissionFeedback] submission fetch failed', subErr)
    return { ok: false, error: '저장에 실패했습니다. 다시 시도해주세요.' }
  }
  if (!sub) return { ok: false, error: '제출물을 찾을 수 없습니다.' }

  const member = await getMemberByEmail(email)
  const { error } = await supabaseService.from('submission_feedback').insert({
    submission_id: submissionId,
    author_email: email.toLowerCase(),
    author_name: member?.name ?? email.split('@')[0],
    body: content,
  })
  if (error) {
    console.error('[createSubmissionFeedback] insert failed', error)
    return { ok: false, error: '저장에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath(`/members/sessions/${String(sub.session_id)}`)
  return { ok: true }
}

export async function deleteSubmissionFeedback(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const id = String(formData.get('id') ?? '')
  if (!UUID_RE.test(id)) return { ok: false, error: '잘못된 요청입니다.' }
  if (!(await leadEmailOrNull())) return { ok: false, error: '권한이 없습니다.' }

  const { data: row, error: fetchErr } = await supabaseService
    .from('submission_feedback')
    .select('id, session_submissions(session_id)')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) {
    console.error('[deleteSubmissionFeedback] fetch failed', fetchErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }
  if (!row) return { ok: false, error: '이미 삭제된 피드백입니다.' }

  const { error: delErr } = await supabaseService
    .from('submission_feedback')
    .delete()
    .eq('id', id)
  if (delErr) {
    console.error('[deleteSubmissionFeedback] delete failed', delErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  const parent = row.session_submissions as { session_id?: string } | null
  if (parent?.session_id) revalidatePath(`/members/sessions/${parent.session_id}`)
  return { ok: true, error: null }
}
