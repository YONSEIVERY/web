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

/** 마감 시각 경과 여부. 렌더 순수성 린트를 피해 lib에서 판정한다. */
export function isDeadlinePassed(round: RecruitRound | null): boolean {
  if (!round?.apply_deadline) return false
  return Date.now() > new Date(round.apply_deadline).getTime()
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 마감까지 남은 일수. 시각 차가 아니라 KST 날짜 차이라 0은 "마감 당일"을
 * 뜻한다. 이미 지났거나 마감 시각이 없으면 null.
 * 호출부(/recruit)는 force-dynamic이라 Date.now()를 써도 캐시에 굳지 않는다.
 */
export function daysUntilDeadline(round: RecruitRound | null): number | null {
  if (!round?.apply_deadline) return null
  const kstDay = (ms: number) => Math.floor((ms + KST_OFFSET_MS) / DAY_MS)
  const left = kstDay(new Date(round.apply_deadline).getTime()) - kstDay(Date.now())
  return left < 0 ? null : left
}

/** 마감 시각을 KST 기준 "8월 23일 23:59"로 표기한다. */
export function formatDeadlineKst(round: RecruitRound | null): string | null {
  if (!round?.apply_deadline) return null
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(round.apply_deadline))
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
  business_plan_path: string | null
  business_plan_name: string | null
  portfolio_path: string | null
  portfolio_name: string | null
  remote_interview_reason: string | null
  notice_ack: boolean
  privacy_consent: boolean
  status: ApplicationStatus
  created_at: string
  /** 결과 통보 발송 시각. 0020 마이그레이션 전에는 null로 폴백. */
  docs_result_sent_at: string | null
  final_result_sent_at: string | null
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
    business_plan_path: (row.business_plan_path as string | null) ?? null,
    business_plan_name: (row.business_plan_name as string | null) ?? null,
    portfolio_path: (row.portfolio_path as string | null) ?? null,
    portfolio_name: (row.portfolio_name as string | null) ?? null,
    remote_interview_reason:
      (row.remote_interview_reason as string | null) ?? null,
    notice_ack: Boolean(row.notice_ack),
    privacy_consent: Boolean(row.privacy_consent),
    status,
    created_at: String(row.created_at),
    docs_result_sent_at: (row.docs_result_sent_at as string | null) ?? null,
    final_result_sent_at: (row.final_result_sent_at as string | null) ?? null,
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
