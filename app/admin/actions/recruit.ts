'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import { APPLICATION_STATUSES } from '@/lib/recruit/queries'
import type { DeleteState } from './delete-state'

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
