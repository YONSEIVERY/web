'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin, requireLead } from '@/lib/admin/is-admin'
import {
  REGISTRATION_VALUES,
  type RegistrationState,
  type RegistrationValue,
} from './applications-state'

const APPLICATIONS_QUEUE = '/admin/applications' as Route

export async function approveAlumni(id: string) {
  await requireAdmin()
  const now = new Date().toISOString()
  const { error: aErr } = await supabaseService
    .from('alumni')
    .update({ status: 'approved', published: true, approved_at: now })
    .eq('id', id)
  if (aErr) {
    console.error('[approveAlumni] alumni update failed', aErr)
    throw new Error('approve failed')
  }
  const { error: cErr } = await supabaseService
    .from('alumni_companies')
    .update({ status: 'approved', published: true, approved_at: now })
    .eq('founder_alumni_id', id)
  if (cErr) {
    console.error('[approveAlumni] alumni_companies update failed', cErr)
    throw new Error('approve failed')
  }
  revalidatePath('/alumni')
  revalidatePath('/admin/applications')
  redirect(APPLICATIONS_QUEUE)
}

export async function approvePartner(id: string) {
  await requireAdmin()
  const { error } = await supabaseService
    .from('partners')
    .update({ status: 'approved', published: true, approved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('[approvePartner] partners update failed', error)
    throw new Error('approve failed')
  }
  revalidatePath('/partners')
  revalidatePath('/admin/applications')
  redirect(APPLICATIONS_QUEUE)
}

/**
 * 리크루팅 지원서의 등록 회신 표시 (applications.registration).
 *
 * 심사 결과(status)를 바꾸는 setApplicationStatus와는 다른 축이다. 여기서
 * 바꾸는 값은 "본인이 등록하겠다고 회신했는가"이고, 합격자 일괄 등록은
 * status='final_pass' 이면서 registration='registered'인 사람만 명부에
 * 넣는다. 44기에서 등록을 포기한 2명이 버튼 재클릭으로 되살아난 사고가
 * 이 컬럼이 없어서 생겼다.
 *
 * 되돌릴 수 있는 값으로 둔다(확인 대화상자 없음). 이유:
 *   - 이 값 자체는 명부를 바꾸지 않는다. 명부에 반영하는 것은 별도의
 *     합격자 일괄 등록 버튼이고, 그쪽에 이미 확인 절차가 있다.
 *   - 한 라운드에서 20명 넘는 회신을 연달아 입력한다. 매 건 확인 대화상자를
 *     띄우면 사람이 읽지 않고 누르게 되어 오히려 오입력이 늘어난다.
 *   - 잘못 넣어도 같은 자리에서 즉시 되돌릴 수 있고, 되돌리는 비용이 0이다.
 * 대신 목록에서 현재 값이 항상 보이게 해서 잘못된 값이 눈에 띄게 한다.
 *
 * 최종 합격이 아닌 사람은 '최종등록'으로 표시할 수 없다. 그 조합을 허용하면
 * 불합격자가 일괄 등록으로 명부에 들어간다. 조회와 갱신 사이에 심사 상태가
 * 바뀌는 경우까지 막으려고, 판정을 UPDATE의 조건에 함께 건다.
 */
export async function setApplicationRegistration(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const id = String(formData.get('application_id') ?? '')
  const raw = String(formData.get('registration') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }
  if (!REGISTRATION_VALUES.includes(raw as RegistrationValue))
    return { ok: false, error: '값이 올바르지 않습니다.' }
  const value = raw as RegistrationValue

  try {
    // 등록 회신은 리크루팅 데이터다. 0032 기준 lead 전용.
    await requireLead()
  } catch (err) {
    console.error('[setApplicationRegistration] requireLead failed', err)
    return { ok: false, error: '권한이 없습니다.' }
  }

  const base = supabaseService
    .from('applications')
    .update({ registration: value })
    .eq('id', id)
  const { data, error } =
    value === 'registered'
      ? await base.eq('status', 'final_pass').select('id')
      : await base.select('id')

  if (error) {
    console.error('[setApplicationRegistration] update failed', error)
    // 42703 = undefined_column. 마이그레이션 미적용을 뭉뚱그리면 원인 찾기가 길어진다.
    if (error.code === '42703')
      return {
        ok: false,
        error:
          '등록 회신 컬럼(applications.registration)이 아직 없습니다. 마이그레이션을 적용해주세요.',
      }
    return { ok: false, error: '저장에 실패했습니다.' }
  }
  if (!data || data.length === 0)
    return value === 'registered'
      ? {
          ok: false,
          error: '최종 합격자만 최종등록으로 표시할 수 있습니다.',
        }
      : { ok: false, error: '지원서를 찾지 못했습니다.' }

  revalidatePath('/admin/recruit')
  // 합격자 일괄 등록 화면의 대상 인원이 이 값에 따라 달라진다.
  revalidatePath('/admin/members')
  return { ok: true, error: null }
}

export async function rejectApplication(type: 'alumni' | 'partner', id: string, reason: string) {
  await requireAdmin()
  if (type === 'alumni') {
    const { error: aErr } = await supabaseService
      .from('alumni')
      .update({ status: 'rejected', reject_reason: reason })
      .eq('id', id)
    if (aErr) {
      console.error('[rejectApplication] alumni update failed', aErr)
      throw new Error('reject failed')
    }
    const { error: cErr } = await supabaseService
      .from('alumni_companies')
      .update({ status: 'rejected', reject_reason: reason })
      .eq('founder_alumni_id', id)
    if (cErr) {
      console.error('[rejectApplication] alumni_companies update failed', cErr)
      throw new Error('reject failed')
    }
  } else {
    const { error } = await supabaseService
      .from('partners')
      .update({ status: 'rejected', reject_reason: reason })
      .eq('id', id)
    if (error) {
      console.error('[rejectApplication] partners update failed', error)
      throw new Error('reject failed')
    }
  }
  revalidatePath('/admin/applications')
  redirect(APPLICATIONS_QUEUE)
}
