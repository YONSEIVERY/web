'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { getMemberByEmail, getPortalIdentityVerified } from '@/lib/portal/auth'
import type { DeleteState } from '@/app/admin/actions/delete-state'

/**
 * 자기소개 댓글 액션 (0031 intro_comments).
 *
 * 작성자 신원은 session_posts와 같은 방식이다: 로그인 이메일을 원본으로
 * 이름·member_id를 복사해 남긴다. 폼에서 작성자를 받지 않으므로 사칭이
 * 불가능하다. 삭제는 본인 또는 임원진만, 지워진 행은 0026 감사 트리거가
 * audit_log에 원본째 남긴다.
 */

const MAX_BODY = 1000
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export async function createIntroComment(
  profileId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const identity = await getPortalIdentityVerified()
  if (!identity) return { ok: false, error: '로그인이 필요합니다.' }
  if (!UUID_RE.test(String(profileId)))
    return { ok: false, error: '잘못된 요청입니다.' }

  const content = String(body ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  if (!content) return { ok: false, error: '내용을 입력해주세요.' }
  if (content.length > MAX_BODY)
    return {
      ok: false,
      error: `댓글은 ${MAX_BODY.toLocaleString()}자 이하로 적어주세요.`,
    }

  const rl = checkRateLimit(`intro-comment:${identity.email.toLowerCase()}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok)
    return {
      ok: false,
      error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
    }

  const member = await getMemberByEmail(identity.email)
  const authorName = member?.name ?? identity.email.split('@')[0]

  const { error } = await supabaseService.from('intro_comments').insert({
    member_id: profileId,
    author_member_id: member?.id ?? null,
    author_email: identity.email.toLowerCase(),
    author_name: authorName,
    body: content,
  })
  if (error) {
    // 존재하지 않는 소개 페이지에 대한 삽입은 FK가 막는다.
    if (error.code === '23503')
      return { ok: false, error: '대상 멤버를 찾을 수 없습니다.' }
    console.error('[createIntroComment] insert failed', error)
    return { ok: false, error: '저장에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath(`/members/people/${profileId}`)
  return { ok: true }
}

export async function deleteIntroComment(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const id = String(formData.get('id') ?? '')
  if (!UUID_RE.test(id)) return { ok: false, error: '잘못된 요청입니다.' }

  const identity = await getPortalIdentityVerified()
  if (!identity) return { ok: false, error: '권한이 없습니다.' }

  const { data: row, error: fetchErr } = await supabaseService
    .from('intro_comments')
    .select('id, member_id, author_email')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) {
    console.error('[deleteIntroComment] fetch failed', fetchErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }
  if (!row) return { ok: false, error: '이미 삭제된 댓글입니다.' }

  const isOwner =
    String(row.author_email).toLowerCase() === identity.email.toLowerCase()
  if (!isOwner && identity.role !== 'exec')
    return { ok: false, error: '본인 댓글만 삭제할 수 있습니다.' }

  const { error: delErr } = await supabaseService
    .from('intro_comments')
    .delete()
    .eq('id', id)
  if (delErr) {
    console.error('[deleteIntroComment] delete failed', delErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  revalidatePath(`/members/people/${String(row.member_id)}`)
  return { ok: true, error: null }
}
