import 'server-only'
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const NOTIFY_TO = 'yonseivery1997@gmail.com'
export const NOTIFY_FROM = 'VERY 사이트 <onboarding@resend.dev>'
// 샌드박스: NOTIFY_TO는 Resend 가입 이메일과 일치해야 발송됨.
// 운영 전환: yonseivery.com 도메인 인증 후 noreply@yonseivery.com으로 교체.
