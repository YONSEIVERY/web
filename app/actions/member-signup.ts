'use server'
import { headers } from 'next/headers'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { getSiteConfig } from '@/lib/data/site-config'
import type { MemberSignupState } from './member-signup-state'

/**
 * 학회원 자율 등록 신청 (/join 공개 폼).
 *
 * 합격자 일괄 등록으로 커버되지 않는 사람을 위한 경로다. 지원서에 적은
 * 이메일과 실제 구글 로그인 계정이 다르면 포털이 그 사람을 알아보지 못한다
 * (포털은 cohort_members.email로만 사람을 식별한다). 그래서 본인이 직접
 * 로그인에 쓸 주소를 신고하고, 어드민이 승인하면서 cohort_members로 옮긴다.
 *
 * 로그인 게이트가 없는 공개 폼이라 오타와 사칭은 승인 단계에서 걸러진다.
 * 이 액션이 책임지는 것은 (1) 스팸 억제 (2) 이메일 재입력 대조
 * (3) 중복 신청·기등록 안내까지다.
 *
 * 쓰기는 service_role로만 한다. member_signups는 개인정보 테이블이라
 * RLS 정책이 0개이고 anon·authenticated는 읽지도 쓰지도 못한다.
 *
 * 의존하는 member_signups 컬럼 (0027_member_signups.sql):
 *   cohort, name, email, phone, student_id, college, major
 *   status는 default 'pending'을 그대로 쓴다.
 *   unique (cohort, lower(email)) <- 동시 제출 중복은 23505로 막힌다.
 *
 * 동의 여부(privacy_consent)를 남길 컬럼이 0027에 없다. 여기서는 동의를
 * 필수로 검증만 하고 행에는 기록하지 못한다. applications는 같은 값을
 * 컬럼으로 남기므로, 컬럼 추가 여부는 스키마 담당이 판단할 것.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/
const MAX_NAME = 80
const MAX_EMAIL = 254
const MAX_STUDENT_ID = 20
const MAX_COLLEGE = 60
const MAX_MAJOR = 60

async function clientKey() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .trim()
}

/**
 * ilike 패턴의 `_`, `%`는 와일드카드라 `kim_j@..`가 `kimXj@..`에도 걸린다.
 * 이스케이프 대신 넓게 조회한 뒤 JS에서 정확히 대조한다. ilike는 항상
 * 결과를 넓히기만 하므로 놓치는 행은 없고, 과매칭은 여기서 걸러진다.
 */
function hasExactEmail(
  rows: { email: string | null }[] | null,
  email: string,
): boolean {
  const target = email.toLowerCase()
  return (rows ?? []).some((r) => (r.email ?? '').toLowerCase() === target)
}

export async function submitMemberSignup(
  formData: FormData,
): Promise<MemberSignupState> {
  const name = field(formData, 'name').replace(/\s+/g, ' ')
  const email = field(formData, 'email')
  const emailConfirm = field(formData, 'email_confirm')
  const phone = field(formData, 'phone')
  const studentId = field(formData, 'student_id')
  const college = field(formData, 'college')
  const major = field(formData, 'major')
  const privacyConsent = formData.get('privacy_consent') === 'on'

  const fail = (message: string): MemberSignupState => ({
    status: 'error',
    message,
  })

  if (!name || name.length > MAX_NAME) return fail('이름을 확인해주세요.')
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email))
    return fail('이메일 형식을 확인해주세요.')
  // 클라이언트 검증만 믿지 않는다. 오타 하나가 곧 로그인 불가다.
  if (email.toLowerCase() !== emailConfirm.toLowerCase())
    return fail('두 이메일이 서로 다릅니다. 다시 확인해주세요.')
  if (!PHONE_RE.test(phone)) return fail('연락처 형식을 확인해주세요.')
  if (studentId.length > MAX_STUDENT_ID) return fail('학번을 확인해주세요.')
  if (college.length > MAX_COLLEGE) return fail('단과대를 확인해주세요.')
  if (major.length > MAX_MAJOR) return fail('전공을 확인해주세요.')
  if (!privacyConsent) return fail('개인정보 수집·이용에 동의해주세요.')

  const ip = await clientKey()
  // 학회 행사장·캠퍼스 와이파이는 24명이 같은 IP로 잡힌다. IP 단독 한도는
  // 봇을 막을 만큼만 높이고, 사람 단위 재시도는 이메일까지 묶어 좁게 건다.
  const burst = checkRateLimit(`member-signup:${ip}`, {
    limit: 100,
    windowMs: 60 * 60 * 1000,
  })
  if (!burst.ok)
    return fail(`잠시 후 다시 시도해주세요. (${burst.retryAfterSec}초)`)
  const rl = checkRateLimit(`member-signup:${ip}:${email.toLowerCase()}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok) return fail(`잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`)

  const { cohort } = await getSiteConfig()

  // 이미 학회원이면 신청할 이유가 없다. 포털은 기수와 무관하게 이메일로
  // 사람을 찾으므로(getMemberByEmail) 전 기수를 대상으로 확인한다.
  const { data: members, error: memberErr } = await supabaseService
    .from('cohort_members')
    .select('id, email')
    .ilike('email', email)
    .limit(5)
  if (memberErr) {
    console.error('submitMemberSignup member lookup failed', memberErr)
    return fail('확인에 실패했습니다. 잠시 후 다시 시도해주세요.')
  }
  if (hasExactEmail(members, email))
    return {
      status: 'notice',
      message:
        '이미 등록된 학회원입니다. 이 주소로 포털에 바로 로그인하실 수 있습니다. 기수나 정보가 다르면 운영진에게 문의해주세요.',
    }

  const { data: signups, error: signupErr } = await supabaseService
    .from('member_signups')
    .select('id, email')
    .eq('cohort', cohort)
    .ilike('email', email)
    .limit(5)
  if (signupErr) {
    console.error('submitMemberSignup signup lookup failed', signupErr)
    return fail('확인에 실패했습니다. 잠시 후 다시 시도해주세요.')
  }
  if (hasExactEmail(signups, email))
    return {
      status: 'notice',
      message:
        '이미 신청하셨습니다. 운영진 승인이 끝나면 포털에 입장하실 수 있습니다. 승인이 오래 걸린다면 운영진에게 문의해주세요.',
    }

  const { error: insErr } = await supabaseService.from('member_signups').insert({
    cohort,
    name,
    email,
    phone,
    student_id: studentId || null,
    college: college || null,
    major: major || null,
  })
  if (insErr) {
    // 동시 제출로 위 조회를 통과한 중복은 유니크 인덱스가 막는다.
    if (insErr.code === '23505')
      return {
        status: 'notice',
        message:
          '이미 신청하셨습니다. 운영진 승인이 끝나면 포털에 입장하실 수 있습니다. 승인이 오래 걸린다면 운영진에게 문의해주세요.',
      }
    console.error('submitMemberSignup insert failed', insErr)
    return fail('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
  }

  return { status: 'success' }
}
