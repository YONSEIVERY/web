import 'server-only'
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const NOTIFY_TO = 'yonseivery1997@gmail.com'
export const NOTIFY_FROM = 'VERY 사이트 <noreply@send.resend.dev>'
//                          ↑ Phase 1.5에서 yonseivery.com으로 교체
