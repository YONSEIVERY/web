'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseService } from '@/lib/supabase/service'
import { requireExec } from '@/lib/portal/auth'
import type { DeleteState } from '@/app/admin/actions/delete-state'
import {
  ATTENDANCE_STATUSES,
  SESSION_KINDS,
  type AttendanceStatus,
  type SessionKind,
} from '@/lib/portal/queries'

/**
 * 포털 임원진 액션. 미들웨어가 /members를 gate하지만 mutation은 전부
 * requireExec로 이중 방어한다 (임원진 전용).
 */

function kstLocalToISO(local: string): string {
  return new Date(`${local}:00+09:00`).toISOString()
}

function parseSessionForm(formData: FormData) {
  const cohort = Number(String(formData.get('cohort') ?? '').trim())
  const kindRaw = String(formData.get('kind') ?? 'regular')
  const kind: SessionKind = SESSION_KINDS.includes(kindRaw as SessionKind)
    ? (kindRaw as SessionKind)
    : 'regular'
  const weekRaw = String(formData.get('week') ?? '').trim()
  const week = weekRaw === '' ? null : Number(weekRaw)
  const title = String(formData.get('title') ?? '').trim()
  const speaker = String(formData.get('speaker') ?? '').trim() || null
  const eventDateRaw = String(formData.get('event_date') ?? '').trim()
  const event_date = eventDateRaw === '' ? null : kstLocalToISO(eventDateRaw)
  const location = String(formData.get('location') ?? '').trim() || null
  const location_note =
    String(formData.get('location_note') ?? '').trim() || null
  const content_md = String(formData.get('content_md') ?? '')
  const is_published = formData.get('is_published') === 'on'
  const allow_posts = formData.get('allow_posts') === 'on'
  const sortRaw = String(formData.get('sort_order') ?? '').trim()
  const sort_order = sortRaw === '' ? 100 : Number(sortRaw)

  if (!Number.isInteger(cohort) || cohort < 1 || cohort > 100)
    throw new Error('기수 값이 올바르지 않습니다.')
  if (week !== null && (!Number.isInteger(week) || week < 0 || week > 30))
    throw new Error('주차 값이 올바르지 않습니다.')
  if (!title || title.length > 200)
    throw new Error('제목을 확인해주세요.')
  if (!Number.isInteger(sort_order))
    throw new Error('정렬 값이 올바르지 않습니다.')

  return {
    cohort,
    kind,
    week,
    title,
    speaker,
    event_date,
    location,
    location_note,
    content_md,
    is_published,
    allow_posts,
    sort_order,
  }
}

export async function createSession(formData: FormData) {
  await requireExec()
  const values = parseSessionForm(formData)
  const { data, error } = await supabaseService
    .from('club_sessions')
    .insert(values)
    .select('id')
    .single()
  if (error || !data) {
    console.error('[createSession] insert failed', error)
    throw new Error('세션 저장에 실패했습니다.')
  }
  revalidatePath('/members')
  revalidatePath('/members/manage/sessions')
  // 편집 화면으로 보내면 방금 채운 폼이 그대로 다시 떠서 저장이 된 것인지 알 수 없다.
  // 목록으로 보내야 새 세션이 눈에 보이고, 그래야 연타로 중복 생성하지 않는다.
  redirect('/members/manage/sessions')
}

export async function updateSession(formData: FormData) {
  await requireExec()
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('잘못된 요청입니다.')
  const values = parseSessionForm(formData)
  const { error } = await supabaseService
    .from('club_sessions')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('[updateSession] update failed', error)
    throw new Error('세션 저장에 실패했습니다.')
  }
  revalidatePath('/members')
  revalidatePath('/members/manage/sessions')
  revalidatePath(`/members/sessions/${id}`)
  revalidatePath(`/members/manage/sessions/${id}`)
  redirect('/members/manage/sessions')
}

// DeleteButton(useActionState)이 쓰는 시그니처. 실패는 던지지 않고 상태로
// 돌려줘야 편집 화면이 살아 있는 채로 사유가 보인다. 성공 경로의 redirect는
// never라 반환형과 충돌하지 않는다.
export async function deleteSession(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  await requireExec()
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }
  const { error } = await supabaseService
    .from('club_sessions')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('[deleteSession] delete failed', error)
    return { ok: false, error: '세션 삭제에 실패했습니다.' }
  }
  revalidatePath('/members')
  redirect('/members/manage/sessions')
}

export async function createNotice(formData: FormData) {
  await requireExec()
  const cohort = Number(String(formData.get('cohort') ?? '').trim())
  const title = String(formData.get('title') ?? '').trim()
  const content_md = String(formData.get('content_md') ?? '')
  const pinned = formData.get('pinned') === 'on'
  if (!Number.isInteger(cohort) || cohort < 1 || cohort > 100)
    throw new Error('기수 값이 올바르지 않습니다.')
  if (!title || title.length > 200) throw new Error('제목을 확인해주세요.')
  const { error } = await supabaseService
    .from('notices')
    .insert({ cohort, title, content_md, pinned })
  if (error) {
    console.error('[createNotice] insert failed', error)
    throw new Error('공지 저장에 실패했습니다.')
  }
  revalidatePath('/members')
  revalidatePath('/members/manage/notices')
}

export async function deleteNotice(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  await requireExec()
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }
  const { error } = await supabaseService.from('notices').delete().eq('id', id)
  if (error) {
    console.error('[deleteNotice] delete failed', error)
    return { ok: false, error: '공지 삭제에 실패했습니다.' }
  }
  revalidatePath('/members')
  revalidatePath('/members/manage/notices')
  return { ok: true, error: null }
}

export async function setAttendance(formData: FormData) {
  await requireExec()
  const sessionId = String(formData.get('session_id') ?? '')
  const memberId = String(formData.get('member_id') ?? '')
  const statusRaw = String(formData.get('status') ?? '')
  const assignmentMissing = formData.get('assignment_missing') === 'on'
  const note = String(formData.get('note') ?? '').trim() || null
  if (!sessionId || !memberId) throw new Error('잘못된 요청입니다.')
  if (!ATTENDANCE_STATUSES.includes(statusRaw as AttendanceStatus))
    throw new Error('출결 상태 값이 올바르지 않습니다.')

  const { error } = await supabaseService.from('attendance').upsert(
    {
      session_id: sessionId,
      member_id: memberId,
      status: statusRaw,
      assignment_missing: assignmentMissing,
      note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,member_id' },
  )
  if (error) {
    console.error('[setAttendance] upsert failed', error)
    throw new Error('출결 저장에 실패했습니다.')
  }
  revalidatePath(`/members/manage/attendance/${sessionId}`)
  revalidatePath('/members/attendance')
}
