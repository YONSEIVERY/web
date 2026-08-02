'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import { APPLICATION_STATUSES } from '@/lib/recruit/queries'

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
