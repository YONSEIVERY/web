'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import { normName, phoneTail } from '@/lib/members/identity'
import type { MemberSignupActionState } from './member-signups-state'

/**
 * 자율 등록 신청(member_signups) 심사.
 *
 * 공개 폼이라 지원서 대조는 화면이 배지로 보여줄 뿐, 최종 판단은 사람이 한다.
 * 여기서는 승인·반려의 부작용만 책임진다.
 *
 * 승인: cohort_members에 role_tier='member' · published=true로 행을 만들고,
 * 신청을 approved로 표시한다. 포털은 cohort_members.email로 사람을 알아보므로
 * 이메일은 소문자로 정규화해 넣는다(portal_role RPC가 lower() 비교라 안전하다).
 *
 * 중복 방지는 세 겹이다.
 *  1) 상태 선점: 조건부 UPDATE로 신청을 먼저 approved로 바꾸고, 실제로 바뀐
 *     행이 있을 때만 학회원을 만든다. 연타로 두 요청이 겹쳐도 한쪽만 통과한다.
 *  2) 명단 확인: 같은 기수에 같은 이메일이 이미 있으면 새로 만들지 않는다.
 *     (일괄 등록과 겹치는 경우)
 *  3) 동일인 확인: 이메일은 다른데 같은 기수에 이름과 전화가 같은 행이 있으면
 *     멈추고 사람에게 넘긴다. 이 폼의 주경로가 "일괄 등록된 사람이 다른
 *     주소로 신청"이라 이 확인이 없으면 명단에 같은 사람이 두 번 들어간다.
 * 학회원 생성이 실패하면 선점을 되돌려 신청을 원래 상태로 돌려놓는다.
 *
 * 반려는 행을 지우지 않는다. 기록이 남아야 한다.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const SIGNUP_COLUMNS =
  'id, cohort, name, email, phone, student_id, college, major, status'

type SignupRow = {
  id: string
  cohort: number
  name: string
  email: string
  phone: string | null
  student_id: string | null
  college: string | null
  major: string | null
  status: string
}

function fail(message: string): MemberSignupActionState {
  return { status: 'error', message }
}

function ok(message: string): MemberSignupActionState {
  return { status: 'success', message }
}

async function loadSignup(id: string): Promise<SignupRow | null> {
  const { data, error } = await supabaseService
    .from('member_signups')
    .select(SIGNUP_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('[member-signups] load failed', error)
    return null
  }
  if (!data) return null
  const row = data as Record<string, unknown>
  return {
    id: String(row.id),
    cohort: Number(row.cohort),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: (row.phone as string | null) ?? null,
    student_id: (row.student_id as string | null) ?? null,
    college: (row.college as string | null) ?? null,
    major: (row.major as string | null) ?? null,
    status: String(row.status ?? 'pending'),
  }
}

/** 신청 목록과, 승인으로 명단이 바뀌는 공개 소비처를 함께 재검증한다. */
function revalidateReview(cohort?: number) {
  revalidatePath('/admin/members/signups')
  revalidatePath('/admin/members')
  if (cohort !== undefined && Number.isFinite(cohort)) {
    revalidatePath('/about')
    revalidatePath('/cohorts')
    revalidatePath(`/cohorts/${cohort}`)
  }
}

export async function approveMemberSignup(
  _prev: MemberSignupActionState,
  formData: FormData,
): Promise<MemberSignupActionState> {
  let adminEmail: string
  try {
    adminEmail = await requireAdmin()
  } catch {
    return fail('권한이 없습니다.')
  }
  const id = String(formData.get('id') ?? '').trim()
  if (!UUID_RE.test(id)) return fail('잘못된 요청입니다.')

  const signup = await loadSignup(id)
  if (!signup) return fail('신청을 찾을 수 없습니다.')
  if (signup.status === 'approved') return ok('이미 승인된 신청입니다.')

  const email = signup.email.trim().toLowerCase()
  if (!email) return fail('신청에 이메일이 없어 승인할 수 없습니다.')
  if (!Number.isInteger(signup.cohort))
    return fail('신청의 기수가 올바르지 않습니다.')

  const previousStatus = signup.status
  const reviewedAt = new Date().toISOString()

  // 1) 선점. 상태가 그대로일 때만 approved로 바뀐다.
  const { data: claimed, error: claimErr } = await supabaseService
    .from('member_signups')
    .update({
      status: 'approved',
      reviewed_at: reviewedAt,
      reviewed_by: adminEmail,
    })
    .eq('id', id)
    .eq('status', previousStatus)
    .select('id')
    .maybeSingle()
  if (claimErr) {
    console.error('[approveMemberSignup] claim failed', claimErr)
    return fail('승인 처리에 실패했습니다.')
  }
  if (!claimed) return ok('이미 처리된 신청입니다.')

  const rollback = async () => {
    const { error } = await supabaseService
      .from('member_signups')
      .update({ status: previousStatus, reviewed_at: null, reviewed_by: null })
      .eq('id', id)
    if (error) console.error('[approveMemberSignup] rollback failed', error)
  }

  // 2) 같은 기수 명단 확인. ilike는 이메일에 흔한 밑줄을 와일드카드로
  //    해석하므로 쓰지 않고, 기수 명단을 받아 소문자로 맞춰본다.
  const { data: existing, error: existErr } = await supabaseService
    .from('cohort_members')
    .select('id, name, email, phone')
    .eq('cohort', signup.cohort)
  if (existErr) {
    console.error('[approveMemberSignup] member lookup failed', existErr)
    await rollback()
    return fail('기존 명단 확인에 실패했습니다.')
  }
  const roster = (existing ?? []) as {
    name: string | null
    email: string | null
    phone: string | null
  }[]
  const duplicate = roster.some(
    (m) => String(m.email ?? '').trim().toLowerCase() === email,
  )

  // 이메일은 다른데 같은 사람이 이미 명단에 있는 경우를 막는다.
  //
  // 이 폼이 존재하는 이유가 "지원서 이메일과 구글 로그인 계정이 다르다"이므로,
  // 합격자 일괄 등록이 먼저 돌고 그 사람이 다른 주소로 신청하는 것이 예외가
  // 아니라 주경로다. 그대로 insert하면 같은 사람이 명단에 두 번 들어가고
  // /cohorts/<기수> 공개 페이지에도 두 번 나온다.
  //
  // 기존 행의 이메일을 여기서 자동으로 바꾸지는 않는다. 이름과 전화만 맞으면
  // 남의 포털 로그인 주소를 갈아끼울 수 있는 경로가 되기 때문이다. 사람이
  // 학회원 화면에서 고치도록 멈추고 알린다.
  const tail = phoneTail(signup.phone)
  const sameName = normName(signup.name)
  const samePerson =
    duplicate || !tail || !sameName
      ? undefined
      : roster.find(
          (m) => normName(m.name) === sameName && phoneTail(m.phone) === tail,
        )
  if (samePerson) {
    await rollback()
    const shown = String(samePerson.email ?? '').trim()
    return fail(
      `${signup.name}님은 이미 ${shown || '이메일 없이'} ${signup.cohort}기 명단에 있습니다. ` +
        `이대로 승인하면 같은 사람이 두 번 등록됩니다. 학회원 화면에서 그 행의 이메일을 ` +
        `${signup.email}로 고친 뒤 이 신청을 반려하십시오.`,
    )
  }

  if (!duplicate) {
    const { error: insErr } = await supabaseService
      .from('cohort_members')
      .insert({
        cohort: signup.cohort,
        name: signup.name,
        role_tier: 'member',
        email,
        phone: signup.phone,
        student_id: signup.student_id,
        college: signup.college,
        major: signup.major,
        published: true,
      })
    if (insErr) {
      console.error('[approveMemberSignup] insert failed', insErr)
      await rollback()
      return fail('학회원 등록에 실패했습니다.')
    }
  }

  revalidateReview(signup.cohort)
  return ok(
    duplicate
      ? '이미 명단에 있어 신청만 승인 처리했습니다.'
      : `${signup.cohort}기 학회원으로 등록했습니다.`,
  )
}

export async function rejectMemberSignup(
  _prev: MemberSignupActionState,
  formData: FormData,
): Promise<MemberSignupActionState> {
  let adminEmail: string
  try {
    adminEmail = await requireAdmin()
  } catch {
    return fail('권한이 없습니다.')
  }
  const id = String(formData.get('id') ?? '').trim()
  if (!UUID_RE.test(id)) return fail('잘못된 요청입니다.')

  const signup = await loadSignup(id)
  if (!signup) return fail('신청을 찾을 수 없습니다.')
  if (signup.status === 'approved')
    return fail('이미 승인된 신청입니다. 학회원 목록에서 직접 정리하십시오.')
  if (signup.status === 'rejected') return ok('이미 반려된 신청입니다.')

  const { error } = await supabaseService
    .from('member_signups')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail,
    })
    .eq('id', id)
    .eq('status', signup.status)
  if (error) {
    console.error('[rejectMemberSignup] failed', error)
    return fail('반려 처리에 실패했습니다.')
  }

  revalidateReview()
  return ok('반려 처리했습니다.')
}
