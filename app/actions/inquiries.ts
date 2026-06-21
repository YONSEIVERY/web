'use server'
import { headers } from 'next/headers'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendInquiryNotification } from '@/lib/email/notifications'
import type { InquiryFormState } from './inquiries-state'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function clientKey() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

export async function submitIndustryInquiry(
  _prev: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  if (formData.get('website')) return { status: 'success' }

  const affiliation = String(formData.get('company') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const subject = String(formData.get('subject') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!affiliation || affiliation.length > 120) return { status: 'error', message: '회사명을 확인해주세요.' }
  if (!name || name.length > 80) return { status: 'error', message: '담당자명을 확인해주세요.' }
  if (!EMAIL_RE.test(email)) return { status: 'error', message: '이메일 형식을 확인해주세요.' }
  if (!['멘토링', '세션 진행', '공동 프로젝트', '기타'].includes(subject))
    return { status: 'error', message: '문의 분류를 선택해주세요.' }
  if (message.length < 10 || message.length > 2000)
    return { status: 'error', message: '메시지는 10–2000자 사이로 작성해주세요.' }

  const rl = checkRateLimit(`industry:${await clientKey()}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.ok) return { status: 'error', message: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)` }

  const id = crypto.randomUUID()
  const { error } = await supabaseService
    .from('inquiries')
    .insert({ id, type: 'INDUSTRY', name, email, affiliation, subject, message })
  if (error) {
    console.error('submitIndustryInquiry insert failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }

  await sendInquiryNotification({
    id,
    type: 'INDUSTRY',
    name,
    email,
    affiliation,
    subject,
    message,
  })

  return { status: 'success' }
}
