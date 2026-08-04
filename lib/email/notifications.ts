import 'server-only'
import { resend, NOTIFY_TO, NOTIFY_FROM, APPLICANT_FROM } from './client'
import InquiryNotification from '@/emails/inquiry-notification'
import PartnerApplicationNotification from '@/emails/partner-application-notification'
import AlumniRegistrationNotification from '@/emails/alumni-registration-notification'
import DemodayAttendeeNotification from '@/emails/demoday-attendee-notification'
import RecruitApplicationNotification from '@/emails/recruit-application-notification'
import RecruitApplicantConfirmation from '@/emails/recruit-applicant-confirmation'
import RecruitResultNotification from '@/emails/recruit-result-notification'

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
      subject: `[VERY] 신규 ${args.type === 'INDUSTRY' ? '산학협력' : ''} 문의 · ${args.name}`,
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
      subject: `[VERY] 신규 파트너십 신청 · ${args.name}`,
      react: PartnerApplicationNotification(args),
    })
  } catch (e) {
    console.error('sendPartnerApplicationNotification failed', e)
  }
}

export async function sendDemodayAttendeeNotification(args: {
  eventId: string
  attendeeId: string
  volume: number
  semester: string
  name: string
  affiliation: string
  email: string
  phone: string
  isVeryAlumni: boolean
  veryCohort: number | null
  attendAfterparty: boolean | null
  purposes: string[]
  role: string
  referralSources: string[]
}) {
  try {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `[VERY] 데모데이 Vol.${args.volume} 참관 신청 · ${args.name}`,
      react: DemodayAttendeeNotification(args),
    })
  } catch (e) {
    console.error('sendDemodayAttendeeNotification failed', e)
  }
}

export async function sendRecruitApplicationNotification(args: {
  applicationId: string
  cohort: number
  name: string
  phone: string
  email: string
  remoteReason: string | null
  fileName: string
}) {
  try {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `[VERY] ${args.cohort}기 지원서 접수 · ${args.name}`,
      react: RecruitApplicationNotification(args),
    })
  } catch (e) {
    console.error('sendRecruitApplicationNotification failed', e)
  }
}

/**
 * 지원자 본인 접수 확인 메일. yonseivery.com 도메인 인증 전에는 Resend가
 * 발송을 거부하므로 에러 로그만 남고, 인증 완료 시점부터 자동 발송된다.
 * 접수 자체는 이 메일의 성패와 무관하게 완료된다.
 */
export async function sendRecruitApplicantConfirmation(args: {
  to: string
  cohort: number
  name: string
  fileName: string
}) {
  try {
    await resend.emails.send({
      from: APPLICANT_FROM,
      to: args.to,
      subject: `[VERY] ${args.cohort}기 지원서 접수 완료`,
      react: RecruitApplicantConfirmation(args),
    })
  } catch (e) {
    console.error('sendRecruitApplicantConfirmation failed', e)
  }
}

/**
 * 지원 결과 통보 일괄 발송. Resend batch API로 100건 단위 청크 전송한다.
 * 다른 알림과 달리 실패를 삼키지 않는다: 호출부(어드민 액션)가 성공 여부를
 * 보고 발송 시각을 기록할지 결정해야 하기 때문.
 */
export async function sendRecruitResultBatch(args: {
  recipients: { to: string; name: string }[]
  cohort: number
  stage: 'docs' | 'final'
  pass: boolean
}): Promise<{ ok: boolean; error?: string }> {
  const stageLabel = args.stage === 'docs' ? '서류 전형' : '최종 전형'
  const CHUNK = 100
  for (let i = 0; i < args.recipients.length; i += CHUNK) {
    const chunk = args.recipients.slice(i, i + CHUNK)
    const { error } = await resend.batch.send(
      chunk.map((r) => ({
        from: APPLICANT_FROM,
        to: r.to,
        subject: `[VERY] ${args.cohort}기 ${stageLabel} 결과 안내`,
        react: RecruitResultNotification({
          name: r.name,
          cohort: args.cohort,
          stage: args.stage,
          pass: args.pass,
        }),
      })),
    )
    if (error) {
      console.error('sendRecruitResultBatch failed', error)
      return { ok: false, error: error.message }
    }
  }
  return { ok: true }
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
      subject: `[VERY] 신규 알럼나이 신청 · ${args.name} (${args.cohort}기)${args.hasCompany ? ' +회사' : ''}`,
      react: AlumniRegistrationNotification(args),
    })
  } catch (e) {
    console.error('sendAlumniRegistrationNotification failed', e)
  }
}
