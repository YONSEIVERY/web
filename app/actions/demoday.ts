'use server'
import { headers } from 'next/headers'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendDemodayAttendeeNotification } from '@/lib/email/notifications'
import { getCurrentDemoday } from '@/lib/demoday/queries'
import type { DemodayFormState } from './demoday-state'

/**
 * 데모데이 참관 신청. 현재(`is_current=true`) + 모집 중(`register_open`)
 * 회차로 자동 라우팅된다. 신청자는 사후 자신의 입력을 다시 볼 수 없고,
 * 어드민(service_role)만 명단을 조회한다. PII RLS는 SELECT 전면 차단.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/

async function clientKey() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

function pickArray(formData: FormData, name: string, allowed: Set<string>) {
  return formData
    .getAll(name)
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0 && allowed.has(v))
}

export async function submitDemodayAttendee(
  _prev: DemodayFormState,
  formData: FormData,
): Promise<DemodayFormState> {
  // honeypot — bot이 채우면 조용히 통과시키지 않고 success 시늉
  const hp = String(formData.get('website_hp') ?? '').trim()
  if (hp) return { status: 'success' }

  const current = await getCurrentDemoday()
  if (!current) {
    return { status: 'error', message: '진행 중인 데모데이가 없습니다.' }
  }
  if (!current.register_open) {
    return {
      status: 'error',
      message: '아직 신청을 받고 있지 않습니다. 인스타그램으로 일정을 확인해주세요.',
    }
  }

  const name = String(formData.get('name') ?? '').trim()
  const affiliation = String(formData.get('affiliation') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const isVeryAlumniRaw = String(formData.get('is_very_alumni') ?? '').trim()
  const veryCohortRaw = String(formData.get('very_cohort') ?? '').trim()
  const attendAfterpartyRaw = String(
    formData.get('attend_afterparty') ?? '',
  ).trim()
  const role = String(formData.get('role') ?? '').trim()
  const privacyConsent = formData.get('privacy_consent') === 'on'

  if (!name || name.length > 80)
    return { status: 'error', message: '이름을 확인해주세요.' }
  if (!affiliation || affiliation.length > 120)
    return { status: 'error', message: '소속을 확인해주세요.' }
  if (!PHONE_RE.test(phone))
    return { status: 'error', message: '연락처 형식을 확인해주세요.' }
  if (!EMAIL_RE.test(email))
    return { status: 'error', message: '이메일 형식을 확인해주세요.' }
  if (isVeryAlumniRaw !== 'yes' && isVeryAlumniRaw !== 'no')
    return { status: 'error', message: 'VERY 동문 여부를 선택해주세요.' }
  const isVeryAlumni = isVeryAlumniRaw === 'yes'

  let veryCohort: number | null = null
  if (isVeryAlumni) {
    veryCohort = Number(veryCohortRaw)
    if (!Number.isInteger(veryCohort) || veryCohort < 1 || veryCohort > 100)
      return { status: 'error', message: '기수를 1~100 사이로 입력해주세요.' }
  }

  let attendAfterparty: boolean | null = null
  if (attendAfterpartyRaw === 'yes') attendAfterparty = true
  else if (attendAfterpartyRaw === 'no') attendAfterparty = false

  const allowedPurposes = new Set(current.form_choices.purposes)
  const allowedRoles = new Set(current.form_choices.roles)
  const allowedSources = new Set(current.form_choices.sources)

  const purposes = pickArray(formData, 'purposes', allowedPurposes)
  if (purposes.length === 0)
    return { status: 'error', message: '참가 목적을 최소 1개 선택해주세요.' }

  if (!allowedRoles.has(role))
    return { status: 'error', message: '역할을 선택해주세요.' }

  const referralSources = pickArray(formData, 'referral_sources', allowedSources)

  if (!privacyConsent)
    return { status: 'error', message: '개인정보 수집·이용에 동의해주세요.' }

  const rl = checkRateLimit(`demoday:${await clientKey()}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  })
  if (!rl.ok)
    return {
      status: 'error',
      message: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`,
    }

  const attendeeId = crypto.randomUUID()
  const { error } = await supabaseService.from('demoday_attendees').insert({
    id: attendeeId,
    event_id: current.id,
    name,
    affiliation,
    phone,
    email,
    is_very_alumni: isVeryAlumni,
    very_cohort: veryCohort,
    attend_afterparty: attendAfterparty,
    purposes,
    role,
    referral_sources: referralSources,
    privacy_consent: true,
  })
  if (error) {
    console.error('submitDemodayAttendee insert failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }

  await sendDemodayAttendeeNotification({
    eventId: current.id,
    attendeeId,
    volume: current.volume,
    semester: current.semester,
    name,
    affiliation,
    email,
    phone,
    isVeryAlumni,
    veryCohort,
    attendAfterparty,
    purposes,
    role,
    referralSources,
  })

  return { status: 'success' }
}
