'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireLead } from '@/lib/admin/is-admin'
import { sendRecruitResultBatch } from '@/lib/email/notifications'
import {
  APPLICATION_STATUSES,
  getCurrentRecruitRound,
} from '@/lib/recruit/queries'
import type { DeleteState } from './delete-state'
import type { SendResultsState } from './send-results-state'

/**
 * 리크루팅 어드민 액션. 접수 open/close 토글과 지원자 심사 상태 변경.
 * 페이지 자체는 middleware가 gate하지만, 액션은 requireLead로 이중 방어 (0032: 리크루팅 쓰기는 lead 전용).
 */

export async function toggleRecruitOpen(formData: FormData) {
  await requireLead()
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

/**
 * 마감 시각 설정·해제. 시즌 화면의 상태 기계가 이 값 하나로 움직인다.
 *
 *  미래 마감 + 접수 열기  -> 접수 화면 (카운트다운 포함)
 *  마감 경과              -> "접수가 마감되었습니다" + 면접·발표 일정 유지
 *  마감 비움 + 접수 닫기  -> "지금은 접수 기간이 아닙니다" (시즌 종료)
 *
 * 지금까지 이 값을 고칠 어드민 컨트롤이 없어서, 발표가 끝난 뒤에도 공개
 * 화면이 지난 시즌 일정에 멈춰 있었고 SQL로만 벗어날 수 있었다.
 */
export async function setRecruitDeadline(formData: FormData) {
  await requireLead()
  const roundId = String(formData.get('round_id') ?? '')
  const intent = String(formData.get('intent') ?? '')
  if (!roundId) return

  let deadline: string | null = null
  if (intent === 'set') {
    const local = String(formData.get('deadline') ?? '').trim()
    // datetime-local 값은 시간대가 없다. 어드민은 KST 기준으로 적으므로
    // +09:00을 붙여 timestamptz로 만든다 (포털 세션 폼과 같은 방식).
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
      throw new Error('마감 시각 형식이 올바르지 않습니다.')
    deadline = new Date(`${local}:00+09:00`).toISOString()
  } else if (intent !== 'clear') {
    throw new Error('잘못된 요청입니다.')
  }

  const { error } = await supabaseService
    .from('recruit_rounds')
    .update({ apply_deadline: deadline, updated_at: new Date().toISOString() })
    .eq('id', roundId)
  if (error) {
    console.error('setRecruitDeadline failed', error)
    throw new Error('마감 시각 변경에 실패했습니다.')
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
    await requireLead()
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
 * 해당 단계의 합불 상태이면서 아직 발송 기록이 없는 지원자에게만 보낸다.
 * 기록을 먼저 찍고 보낸 뒤 나가지 않은 대상만 되돌리므로, 재클릭해도
 * 중복 발송되지 않는다. "검토 전(submitted)" 지원자는 대상에서 제외된다.
 */
export async function sendStageResults(
  _prev: SendResultsState,
  formData: FormData,
): Promise<SendResultsState> {
  try {
    await requireLead()
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
  // 메일은 되돌릴 수 없고 발송 기록은 되돌릴 수 있다. 그래서 스탬프를 먼저
  // 찍고 보낸다. 후-스탬프 구조에서는 기록만 실패해도 재클릭 시 같은
  // 지원자에게 합불 메일이 두 번 나갈 수 있었다.
  for (const pass of [true, false]) {
    const group = rows.filter(
      (r) => r.status === (pass ? passStatus : failStatus),
    )
    if (group.length === 0) continue
    const groupLabel = pass ? '합격 그룹' : '불합격 그룹'

    const { error: claimErr } = await supabaseService
      .from('applications')
      .update({ [sentColumn]: new Date().toISOString() })
      .in(
        'id',
        group.map((r) => r.id),
      )
    if (claimErr) {
      console.error('[sendStageResults] claim failed', claimErr)
      failures.push(`${groupLabel}(기록 실패로 미발송)`)
      continue
    }

    const res = await sendRecruitResultBatch({
      recipients: group.map((r) => ({ to: r.email, name: r.name })),
      cohort: round.cohort,
      stage,
      pass,
    })
    if (res.ok) {
      sentCount += group.length
      continue
    }

    // 실제로 나간 주소는 스탬프를 남겨 두고, 나가지 않은 대상만 되돌려
    // 재시도 대상으로 만든다.
    const delivered = new Set(res.sentTo)
    const undelivered = group.filter((r) => !delivered.has(r.email))
    sentCount += group.length - undelivered.length
    if (undelivered.length === 0) {
      failures.push(groupLabel)
      continue
    }
    const { error: rollbackErr } = await supabaseService
      .from('applications')
      .update({ [sentColumn]: null })
      .in(
        'id',
        undelivered.map((r) => r.id),
      )
    if (rollbackErr) {
      console.error('[sendStageResults] rollback failed', rollbackErr)
      failures.push(`${groupLabel}(발송 실패, 기록 복구 실패. 재시도 전 확인 필요)`)
      continue
    }
    failures.push(groupLabel)
  }

  revalidatePath('/admin/recruit')
  if (failures.length > 0)
    return {
      ok: sentCount > 0,
      message: `${sentCount}건 발송, ${failures.join(' · ')} 실패. 다시 시도하면 미발송분만 재발송됩니다.`,
    }
  return { ok: true, message: `${sentCount}건 발송 완료.` }
}

export async function setApplicationStatus(formData: FormData) {
  await requireLead()
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
