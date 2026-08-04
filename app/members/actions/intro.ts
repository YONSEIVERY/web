'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import type { IntroFormState } from './intro-state'

const MAX_INTRO_LENGTH = 8000

/**
 * 본인 자기소개 저장. 로그인 이메일 ↔ cohort_members 매칭으로 본인 행만
 * 수정할 수 있다 (member_id를 폼에서 받지 않는다). upsert라 반복 저장 안전.
 */
export async function saveMyIntro(
  _prev: IntroFormState,
  formData: FormData,
): Promise<IntroFormState> {
  const identity = await getPortalIdentity()
  if (!identity)
    return { status: 'error', message: '로그인이 필요합니다.' }
  const member = await getMemberByEmail(identity.email)
  if (!member)
    return {
      status: 'error',
      message:
        '로그인 계정과 매칭되는 학회원 정보가 없습니다. 임원진에게 문의해주세요.',
    }

  const body = String(formData.get('body_md') ?? '').replace(/\r\n/g, '\n')
  if (body.length > MAX_INTRO_LENGTH)
    return {
      status: 'error',
      message: `소개는 ${MAX_INTRO_LENGTH.toLocaleString()}자 이하로 작성해주세요.`,
    }

  const { error } = await supabaseService.from('member_intros').upsert(
    {
      member_id: member.id,
      body_md: body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'member_id' },
  )
  if (error) {
    console.error('[saveMyIntro] upsert failed', error)
    return { status: 'error', message: '저장에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath('/members/people')
  revalidatePath(`/members/people/${member.id}`)
  revalidatePath('/members/profile')
  return { status: 'success' }
}
