'use server'
import { headers } from 'next/headers'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendRecruitApplicationNotification } from '@/lib/email/notifications'
import { getCurrentRecruitRound } from '@/lib/recruit/queries'
import type { RecruitFormState, RecruitFormValues } from './recruit-state'

/**
 * 학회원 지원서 접수. 현재(`is_current=true`) + 접수 중(`apply_open`)
 * 라운드로 자동 라우팅된다. 지원서 PDF는 비공개 버킷에 service_role로
 * 업로드하고, 지원자는 사후 자신의 제출을 다시 볼 수 없다 (RLS 전면 차단).
 * 라운드당 이메일 1회 접수는 DB 유니크 인덱스(23505)가 보장한다.
 *
 * 에러 상태는 입력값(values)을 함께 돌려준다 — React 19가 서버 액션 완료 시
 * 폼을 리셋하므로, 클라이언트가 defaultValue로 복원할 재료가 필요하다.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/
const MAX_FILE_BYTES = 4 * 1024 * 1024 // Vercel 요청 본문 4.5MB 하드 제한 고려
const MAX_REASON_LENGTH = 1000

async function clientKey() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

export async function submitRecruitApplication(
  _prev: RecruitFormState,
  formData: FormData,
): Promise<RecruitFormState> {
  // honeypot — bot이 채우면 조용히 success 시늉. 실수로 autofill이 채운
  // 사례를 사후 진단할 수 있게 로그는 남긴다.
  const hp = String(formData.get('extra_field_hp') ?? '').trim()
  if (hp) {
    console.warn('submitRecruitApplication honeypot triggered', {
      length: hp.length,
    })
    return { status: 'success' }
  }

  const name = String(formData.get('name') ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const remoteReason = String(
    formData.get('remote_interview_reason') ?? '',
  ).trim()
  const noticeAck = formData.get('notice_ack') === 'on'
  const privacyConsent = formData.get('privacy_consent') === 'on'
  const file = formData.get('application_file') as File | null

  const values: RecruitFormValues = {
    name,
    phone,
    email,
    remoteReason,
  }
  const fail = (message: string): RecruitFormState => ({
    status: 'error',
    message,
    values,
  })

  const round = await getCurrentRecruitRound()
  if (!round || !round.apply_open) {
    return fail(
      '지금은 접수 기간이 아닙니다. 인스타그램으로 모집 일정을 확인해주세요.',
    )
  }
  if (
    round.apply_deadline &&
    Date.now() > new Date(round.apply_deadline).getTime()
  ) {
    return fail('접수가 마감되었습니다. 다음 시즌에 다시 만나요.')
  }

  if (!name || name.length > 80) return fail('성함을 확인해주세요.')
  if (!PHONE_RE.test(phone)) return fail('연락처 형식을 확인해주세요.')
  if (!EMAIL_RE.test(email)) return fail('이메일 형식을 확인해주세요.')
  if (remoteReason.length > MAX_REASON_LENGTH)
    return fail(
      `비대면 면접 사유는 ${MAX_REASON_LENGTH}자 이하로 작성해주세요.`,
    )
  if (!noticeAck) return fail('지원 전 유의사항을 확인해주세요.')
  if (!privacyConsent) return fail('개인정보 수집·이용에 동의해주세요.')

  if (!file || file.size === 0) return fail('지원서 PDF를 첨부해주세요.')
  if (file.size > MAX_FILE_BYTES)
    return fail('지원서는 4MB 이하 PDF만 가능합니다.')
  if (file.type !== 'application/pdf')
    return fail('지원서는 PDF 파일만 허용됩니다.')
  // MIME은 클라이언트가 보내는 값이라 위조 가능. 파일 시그니처로 재확인한다.
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const isPdf = head.length === 5 && String.fromCharCode(...head) === '%PDF-'
  if (!isPdf) return fail('올바른 PDF 파일이 아닙니다.')

  // 캠퍼스 와이파이는 수백 명이 공인 IP 몇 개를 공유하므로 IP 단독 키는
  // 마감 직전에 정상 지원자를 차단한다. IP+이메일로 키를 좁혀 남용 방지선만
  // 남긴다. 실제 중복 제출은 라운드×이메일 유니크 인덱스가 막는다.
  const rl = checkRateLimit(
    `recruit:${await clientKey()}:${email.toLowerCase()}`,
    { limit: 5, windowMs: 60 * 60 * 1000 },
  )
  if (!rl.ok)
    return fail(`잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)`)

  const applicationId = crypto.randomUUID()
  const filePath = `${round.cohort}/${applicationId}.pdf`

  // 비공개 버킷: anon 정책이 없으므로 service_role로 업로드한다.
  const { error: upErr } = await supabaseService.storage
    .from('recruit-applications')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: false,
    })
  if (upErr) {
    console.error('submitRecruitApplication upload failed', upErr)
    return fail('지원서 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.')
  }

  const { error: insErr } = await supabaseService.from('applications').insert({
    id: applicationId,
    round_id: round.id,
    name,
    phone,
    email,
    file_path: filePath,
    file_name: file.name || `${name}.pdf`,
    remote_interview_reason: remoteReason || null,
    notice_ack: true,
    privacy_consent: true,
  })
  if (insErr) {
    // 고아 파일 정리 (best-effort)
    try {
      const { error: rmErr } = await supabaseService.storage
        .from('recruit-applications')
        .remove([filePath])
      if (rmErr)
        console.error('submitRecruitApplication orphan cleanup failed', rmErr)
    } catch (rmErr) {
      console.error('submitRecruitApplication orphan cleanup threw', rmErr)
    }
    if (insErr.code === '23505') {
      return fail(
        '이미 접수된 이메일입니다. 제출 내용 수정이 필요하면 yonseivery1997@gmail.com으로 연락해주세요.',
      )
    }
    console.error('submitRecruitApplication insert failed', insErr)
    return fail('저장에 실패했습니다.')
  }

  await sendRecruitApplicationNotification({
    applicationId,
    cohort: round.cohort,
    name,
    phone,
    email,
    remoteReason: remoteReason || null,
    fileName: file.name || `${name}.pdf`,
  })

  return { status: 'success' }
}
