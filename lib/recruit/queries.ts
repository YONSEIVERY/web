import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 리크루팅은 기수(cohort)별 라운드로 진행된다. `recruit_rounds` 한 행이
 * 한 시즌이고, 어드민이 `apply_open`으로 접수를 열고 닫는다.
 * `is_current=true`는 부분 유니크 인덱스로 1개만 허용 (demoday와 동일).
 *
 * 모집 요강 카피(일정·유의사항)는 DB가 아니라 `lib/content/recruit.ts`에
 * 둔다 - 시즌마다 코드에서 갱신하는 편이 어드민 폼보다 검수가 쉽다.
 */

export type RecruitRound = {
  id: string
  cohort: number
  semester: '1학기' | '2학기'
  is_current: boolean
  apply_open: boolean
  apply_deadline: string | null
  created_at: string
  updated_at: string
}

function toRound(row: Record<string, unknown>): RecruitRound {
  return {
    id: String(row.id),
    cohort: Number(row.cohort),
    semester: row.semester === '1학기' ? '1학기' : '2학기',
    is_current: Boolean(row.is_current),
    apply_open: Boolean(row.apply_open),
    apply_deadline: (row.apply_deadline as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function getCurrentRecruitRound(): Promise<RecruitRound | null> {
  const { data } = await supabaseService
    .from('recruit_rounds')
    .select('*')
    .eq('is_current', true)
    .maybeSingle()
  if (!data) return null
  return toRound(data as Record<string, unknown>)
}

export async function getRecruitRoundById(
  id: string,
): Promise<RecruitRound | null> {
  const { data } = await supabaseService
    .from('recruit_rounds')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return toRound(data as Record<string, unknown>)
}

export const APPLICATION_STATUSES = [
  'submitted',
  'docs_pass',
  'docs_fail',
  'final_pass',
  'final_fail',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: '검토 전',
  docs_pass: '서류 합격',
  docs_fail: '서류 불합격',
  final_pass: '최종 합격',
  final_fail: '최종 불합격',
}

export type Application = {
  id: string
  round_id: string
  name: string
  phone: string
  email: string
  file_path: string
  file_name: string
  remote_interview_reason: string | null
  notice_ack: boolean
  privacy_consent: boolean
  status: ApplicationStatus
  created_at: string
}

function toApplication(row: Record<string, unknown>): Application {
  const status = APPLICATION_STATUSES.includes(row.status as ApplicationStatus)
    ? (row.status as ApplicationStatus)
    : 'submitted'
  return {
    id: String(row.id),
    round_id: String(row.round_id),
    name: String(row.name),
    phone: String(row.phone),
    email: String(row.email),
    file_path: String(row.file_path),
    file_name: String(row.file_name),
    remote_interview_reason:
      (row.remote_interview_reason as string | null) ?? null,
    notice_ack: Boolean(row.notice_ack),
    privacy_consent: Boolean(row.privacy_consent),
    status,
    created_at: String(row.created_at),
  }
}

export async function getApplications(roundId: string): Promise<Application[]> {
  const { data } = await supabaseService
    .from('applications')
    .select('*')
    .eq('round_id', roundId)
    .order('created_at', { ascending: false })
  if (!data) return []
  return (data as Record<string, unknown>[]).map(toApplication)
}

export async function getApplicationCount(roundId: string): Promise<number> {
  const { count } = await supabaseService
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('round_id', roundId)
  return count ?? 0
}
