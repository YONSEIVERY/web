import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 포털 데이터 조회. 세 테이블 모두 RLS deny-all이므로 service_role로만
 * 읽는다. 호출 전 인가는 미들웨어 + lib/portal/auth.ts가 담당.
 */

export const SESSION_KINDS = ['regular', 'special'] as const
export type SessionKind = (typeof SESSION_KINDS)[number]
export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  regular: '정규 세션',
  special: '비정규 세션',
}

export type ClubSession = {
  id: string
  cohort: number
  kind: SessionKind
  week: number | null
  title: string
  speaker: string | null
  event_date: string | null
  location: string | null
  location_note: string | null
  content_md: string
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

function toSession(row: Record<string, unknown>): ClubSession {
  return {
    id: String(row.id),
    cohort: Number(row.cohort),
    kind: row.kind === 'special' ? 'special' : 'regular',
    week: row.week == null ? null : Number(row.week),
    title: String(row.title),
    speaker: (row.speaker as string | null) ?? null,
    event_date: (row.event_date as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    location_note: (row.location_note as string | null) ?? null,
    content_md: String(row.content_md ?? ''),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 100),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function getSessions(opts: {
  cohort: number
  publishedOnly: boolean
}): Promise<ClubSession[]> {
  let q = supabaseService
    .from('club_sessions')
    .select('*')
    .eq('cohort', opts.cohort)
    .order('kind', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('week', { ascending: true, nullsFirst: false })
  if (opts.publishedOnly) q = q.eq('is_published', true)
  const { data } = await q
  if (!data) return []
  return (data as Record<string, unknown>[]).map(toSession)
}

export async function getSessionById(id: string): Promise<ClubSession | null> {
  const { data } = await supabaseService
    .from('club_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return toSession(data as Record<string, unknown>)
}

export type Notice = {
  id: string
  cohort: number
  title: string
  content_md: string
  pinned: boolean
  created_at: string
  updated_at: string
}

function toNotice(row: Record<string, unknown>): Notice {
  return {
    id: String(row.id),
    cohort: Number(row.cohort),
    title: String(row.title),
    content_md: String(row.content_md ?? ''),
    pinned: Boolean(row.pinned),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function getNotices(cohort: number): Promise<Notice[]> {
  const { data } = await supabaseService
    .from('notices')
    .select('*')
    .eq('cohort', cohort)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  if (!data) return []
  return (data as Record<string, unknown>[]).map(toNotice)
}

export const ATTENDANCE_STATUSES = [
  'present',
  'late',
  'absent',
  'early_leave',
  'excused',
] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: '출석',
  late: '지각',
  absent: '결석',
  early_leave: '조퇴',
  excused: '인정',
}

export type AttendanceRow = {
  id: string
  session_id: string
  member_id: string
  status: AttendanceStatus
  assignment_missing: boolean
  note: string | null
}

function toAttendance(row: Record<string, unknown>): AttendanceRow {
  const status = ATTENDANCE_STATUSES.includes(row.status as AttendanceStatus)
    ? (row.status as AttendanceStatus)
    : 'present'
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    member_id: String(row.member_id),
    status,
    assignment_missing: Boolean(row.assignment_missing),
    note: (row.note as string | null) ?? null,
  }
}

export async function getAttendanceForSession(
  sessionId: string,
): Promise<AttendanceRow[]> {
  const { data } = await supabaseService
    .from('attendance')
    .select('*')
    .eq('session_id', sessionId)
  if (!data) return []
  return (data as Record<string, unknown>[]).map(toAttendance)
}

export async function getAttendanceForMember(
  memberId: string,
): Promise<AttendanceRow[]> {
  const { data } = await supabaseService
    .from('attendance')
    .select('*')
    .eq('member_id', memberId)
  if (!data) return []
  return (data as Record<string, unknown>[]).map(toAttendance)
}

export type RosterMember = {
  id: string
  name: string
  role_tier: string
}

/** 출결 체크 대상 명단 (해당 기수 전원, 정렬은 임원 우선 → 이름순) */
export async function getRoster(cohort: number): Promise<RosterMember[]> {
  const { data } = await supabaseService
    .from('cohort_members')
    .select('id, name, role_tier, sort_order')
    .eq('cohort', cohort)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (!data) return []
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    role_tier: String(row.role_tier ?? 'member'),
  }))
}

/**
 * 회칙의 결석 환산: 결석 1 = 결석 1, 지각 2회 = 결석 1, 과제 미제출 3회 = 결석 1.
 * 3회 이상이면 제명 대상. (조퇴/인정은 환산에 포함하지 않는다.)
 */
export function summarizeAttendance(rows: AttendanceRow[]) {
  const counts = {
    present: 0,
    late: 0,
    absent: 0,
    early_leave: 0,
    excused: 0,
    assignment_missing: 0,
  }
  for (const r of rows) {
    counts[r.status] += 1
    if (r.assignment_missing) counts.assignment_missing += 1
  }
  const convertedAbsences =
    counts.absent +
    Math.floor(counts.late / 2) +
    Math.floor(counts.assignment_missing / 3)
  return { ...counts, convertedAbsences }
}
