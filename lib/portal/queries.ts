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
  allow_posts: boolean
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
    allow_posts: Boolean(row.allow_posts),
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

export type SessionPost = {
  id: string
  session_id: string
  member_id: string | null
  author_email: string
  author_name: string
  content_md: string
  image_paths: string[]
  created_at: string
}

function toPost(row: Record<string, unknown>): SessionPost {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    member_id: row.member_id == null ? null : String(row.member_id),
    author_email: String(row.author_email),
    author_name: String(row.author_name),
    content_md: String(row.content_md ?? ''),
    image_paths: Array.isArray(row.image_paths)
      ? (row.image_paths as unknown[]).filter(
          (v): v is string => typeof v === 'string',
        )
      : [],
    created_at: String(row.created_at),
  }
}

export async function getPostsForSession(
  sessionId: string,
): Promise<SessionPost[]> {
  const { data } = await supabaseService
    .from('session_posts')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
  if (!data) return []
  return (data as Record<string, unknown>[]).map(toPost)
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

/**
 * 자기소개 디렉토리. cohort_members의 공개 성격 필드만 고른다
 * (email·phone·student_id·birth는 절대 select하지 않는다).
 */
export type DirectoryMember = {
  id: string
  name: string
  role_tier: string
  role_label: string | null
  college: string | null
  major: string | null
  photo_url: string | null
  hasIntro: boolean
  excerpt: string | null
}

/** 마크다운 첫 문장을 카드용 발췌로. 기호를 벗기고 60자에서 끊는다. */
function introExcerpt(bodyMd: string): string | null {
  const line = bodyMd
    .split('\n')
    .map((l) => l.replace(/^[#>\-*\s]+/, '').trim())
    .find((l) => l.length > 0)
  if (!line) return null
  return line.length > 60 ? `${line.slice(0, 60)}…` : line
}

export async function getDirectory(cohort: number): Promise<DirectoryMember[]> {
  // member_intros는 임베디드 조회로 같은 요청에 실어 온다(FK: member_id -> id).
  // 왕복 2회가 1회로 접힌다. PostgREST가 일대일을 감지하지 못하면 배열로
  // 내려오므로 아래에서 양쪽 형태를 다 받는다.
  const { data: members } = await supabaseService
    .from('cohort_members')
    .select(
      'id, name, role_tier, role_label, college, major, photo_url, sort_order, member_intros(body_md)',
    )
    .eq('cohort', cohort)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (!members || members.length === 0) return []

  return (members as Record<string, unknown>[]).map((m) => {
    const intro = m.member_intros
    const introRow = Array.isArray(intro) ? intro[0] : intro
    const body = String(
      (introRow as Record<string, unknown> | null | undefined)?.body_md ?? '',
    )
    return {
      id: String(m.id),
      name: String(m.name),
      role_tier: String(m.role_tier ?? 'member'),
      role_label: (m.role_label as string | null) ?? null,
      college: (m.college as string | null) ?? null,
      major: (m.major as string | null) ?? null,
      photo_url: (m.photo_url as string | null) ?? null,
      hasIntro: body.trim().length > 0,
      excerpt: introExcerpt(body),
    }
  })
}

export type MemberProfile = {
  id: string
  cohort: number
  name: string
  role_tier: string
  role_label: string | null
  college: string | null
  major: string | null
  photo_url: string | null
  intro_md: string
  intro_updated_at: string | null
}

export async function getMemberProfile(
  id: string,
): Promise<MemberProfile | null> {
  // 두 조회는 서로 의존하지 않는다. 순차로 기다릴 이유가 없다.
  const [{ data: m }, { data: intro }] = await Promise.all([
    supabaseService
      .from('cohort_members')
      .select('id, cohort, name, role_tier, role_label, college, major, photo_url')
      .eq('id', id)
      .maybeSingle(),
    supabaseService
      .from('member_intros')
      .select('body_md, updated_at')
      .eq('member_id', id)
      .maybeSingle(),
  ])
  if (!m) return null
  const row = m as Record<string, unknown>
  return {
    id: String(row.id),
    cohort: Number(row.cohort),
    name: String(row.name),
    role_tier: String(row.role_tier ?? 'member'),
    role_label: (row.role_label as string | null) ?? null,
    college: (row.college as string | null) ?? null,
    major: (row.major as string | null) ?? null,
    photo_url: (row.photo_url as string | null) ?? null,
    intro_md: String(
      (intro as Record<string, unknown> | null)?.body_md ?? '',
    ),
    intro_updated_at:
      ((intro as Record<string, unknown> | null)?.updated_at as
        | string
        | null) ?? null,
  }
}
