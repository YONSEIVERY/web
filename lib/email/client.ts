import 'server-only'
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// yonseivery.com은 Resend에 도메인 인증 완료 상태다 (2026-08-04, DKIM/SPF/MX).
// 인증이 풀리면 모든 발송이 조용히 실패하므로, 알림이 끊기면 Resend
// Domains 상태부터 확인할 것.
export const NOTIFY_TO = 'yonseivery1997@gmail.com'
export const NOTIFY_FROM = 'VERY 사이트 <noreply@yonseivery.com>'

// 지원자 등 외부 수신자에게 보내는 발신 주소.
export const APPLICANT_FROM = 'VERY <noreply@yonseivery.com>'
