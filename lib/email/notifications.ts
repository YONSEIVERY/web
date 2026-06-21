import 'server-only'
import { resend, NOTIFY_TO, NOTIFY_FROM } from './client'
import InquiryNotification from '@/emails/inquiry-notification'
import PartnerApplicationNotification from '@/emails/partner-application-notification'
import AlumniRegistrationNotification from '@/emails/alumni-registration-notification'

export async function sendInquiryNotification(args: {
  id: string
  type: 'GENERAL' | 'INDUSTRY'
  name: string
  email: string
  affiliation?: string | null
  subject: string
  message: string
}) {
  try {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `[VERY] 신규 ${args.type === 'INDUSTRY' ? '산학협력' : ''} 문의 — ${args.name}`,
      react: InquiryNotification(args),
    })
  } catch (e) {
    console.error('sendInquiryNotification failed', e)
  }
}

export async function sendPartnerApplicationNotification(args: {
  id: string
  name: string
  category: string
  one_liner: string
  applicant_name: string
  applicant_email: string
  applicant_note?: string | null
}) {
  try {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `[VERY] 신규 파트너십 신청 — ${args.name}`,
      react: PartnerApplicationNotification(args),
    })
  } catch (e) {
    console.error('sendPartnerApplicationNotification failed', e)
  }
}

export async function sendAlumniRegistrationNotification(args: {
  alumniId: string
  name: string
  cohort: number
  job_title: string
  bio: string
  hasCompany: boolean
  companyName?: string
}) {
  try {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `[VERY] 신규 알럼나이 신청 — ${args.name} (${args.cohort}기)${args.hasCompany ? ' +회사' : ''}`,
      react: AlumniRegistrationNotification(args),
    })
  } catch (e) {
    console.error('sendAlumniRegistrationNotification failed', e)
  }
}
