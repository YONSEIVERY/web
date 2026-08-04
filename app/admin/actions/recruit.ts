'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import { sendRecruitResultBatch } from '@/lib/email/notifications'
import {
  APPLICATION_STATUSES,
  getCurrentRecruitRound,
} from '@/lib/recruit/queries'
import type { DeleteState } from './delete-state'
import type { SendResultsState } from './send-results-state'

/**
 * 리크루팅 어드민 액션. 접수 open/close 토글과 지원자 심사 상태 변경.
 * 페이지 자체는 middleware가 gate하지만, 액션은 requireAdmin으로 이중 방어.
 */

export async function toggleRecruitOpen(formData: FormData) {
  await requireAdmin()
  const roundId = String(formData.get('round_id') ?? '')
  const next = String(formData.get('next') ?? '') === 'open'
  if (!roundId) return

  const { error } = await supabaseService
    .from('recruit_rounds')
    .update({ apply_open: next, updated_at: new Date().toISOString() })
    .eq('id', roundId)
  if (error) {
    console.error('toggleRecruitOpen failed', error)
    throw new Error('접수 상태 변경에 실패했습니다.')
  }
  revalidatePath('/admin/recruit')
  revalidatePath('/recruit')
}

export async function deleteApplication(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }
  try {
    await requireAdmin()
  } catch (err) {
    console.error('[deleteApplication] requireAdmin failed', err)
    return { ok: false, error: '권한이 없습니다.' }
  }

  const { data: row, error: fetchErr } = await supabaseService
    .from('applications')
    .select('id, file_path, business_plan_path, portfolio_path')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) {
    console.error('[deleteApplication] fetch failed', fetchErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }
  if (!row) return { ok: false, error: '이미 삭제된 지원서입니다.' }

  const { error: delErr } = await supabaseService
    .from('applications')
    .delete()
    .eq('id', id)
  if (delErr) {
    console.error('[deleteApplication] delete failed', delErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  // 첨부 3종도 함께 제거 (best-effort - 실패해도 행 삭제는 유지)
  const paths = [row.file_path, row.business_plan_path, row.portfolio_path]
    .filter(Boolean)
    .map(String)
  if (paths.length > 0) {
    try {
      const { error: rmErr } = await supabaseService.storage
        .from('recruit-applications')
        .remove(paths)
      if (rmErr)
        console.error('[deleteApplication] storage cleanup failed', rmErr)
    } catch (rmErr) {
      console.error('[deleteApplication] storage cleanup threw', rmErr)
    }
  }

  revalidatePath('/admin/recruit')
  return { ok: true, error: null }
}

/**
 * 단계별(서류·최종) 결과 통보 일괄 발송.
 * 해당 단계의 합불 상태이면서 아직 발송 기록이 없는 지원자에게만 보내고,
 * 발송 성공 그룹에만 시각을 찍는다. 재클릭해도 중복 발송되지 않는다.
 * "검토 전(submitted)" 지원자는 대상에서 제외된다.
 */
export async function sendStageResults(
  _prev: SendResultsState,
  formData: FormData,
): Promise<SendResultsState> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, message: '권한이 없습니다.' }
  }

  const stage = String(formData.get('stage') ?? '')
  if (stage !== 'docs' && stage !== 'final')
    return { ok: false, message: '잘못된 요청입니다.' }

  const round = await getCurrentRecruitRound()
  if (!round) return { ok: false, message: '현재 라운드가 없습니다.' }

  const sentColumn =
    stage === 'docs' ? 'docs_result_sent_at' : 'final_result_sent_at'
  const passStatus = stage === 'docs' ? 'docs_pass' : 'final_pass'
  const failStatus = stage === 'docs' ? 'docs_fail' : 'final_fail'

  const { data, error } = await supabaseService
    .from('applications')
    .select(`id, name, email, status`)
    .eq('round_id', round.id)
    .in('status', [passStatus, failStatus])
    .is(sentColumn, null)
  if (error) {
    console.error('[sendStageResults] fetch failed', error)
    return {
      ok: false,
      message:
        '대상 조회에 실패했습니다. 0020 마이그레이션이 적용됐는지 확인해주세요.',
    }
  }
  const rows = (data ?? []) as {
    id: string
    name: string
    email: string
    status: string
  }[]
  if (rows.length === 0)
    return { ok: false, message: '발송할 미통보 지원자가 없습니다.' }

  let sentCount = 0
  const failures: string[] = []
  for (const pass of [true, false]) {
    const group = rows.filter(
      (r) => r.status === (pass ? passStatus : failStatus),
    )
    if (group.length === 0) continue
    const res = await sendRecruitResultBatch({
      recipients: group.map((r) => ({ to: r.email, name: r.name })),
      cohort: round.cohort,
      stage,
      pass,
    })
    if (!res.ok) {
      failures.push(pass ? '합격 그룹' : '불합격 그룹')
      continue
    }
    const { error: stampErr } = await supabaseService
      .from('applications')
      .update({ [sentColumn]: new Date().toISOString() })
      .in(
        'id',
        group.map((r) => r.id),
      )
    if (stampErr)
      console.error('[sendStageResults] stamp failed', stampErr)
    sentCount += group.length
  }

  revalidatePath('/admin/recruit')
  if (failures.length > 0)
    return {
      ok: sentCount > 0,
      message: `${sentCount}건 발송, ${failures.join('·')} 발송 실패. 잠시 후 다시 시도하면 실패분만 재발송됩니다.`,
    }
  return { ok: true, message: `${sentCount}건 발송 완료.` }
}

export async function setApplicationStatus(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('application_id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id) return
  if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
    throw new Error('상태 값이 올바르지 않습니다.')
  }

  const { error } = await supabaseService
    .from('applications')
    .update({ status })
    .eq('id', id)
  if (error) {
    console.error('setApplicationStatus failed', error)
    throw new Error('상태 변경에 실패했습니다.')
  }
  revalidatePath('/admin/recruit')
}
