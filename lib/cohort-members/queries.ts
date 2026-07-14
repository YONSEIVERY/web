import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 학회원(cohort_members) 조회.
 * - PublicMember: 공개 페이지용 (PII 필드 제외)
 * - AdminMember: 어드민 페이지용 (전체 필드)
 *
 * role_tier로 그룹핑해 화면에서 회장/부회장/임원진/일반으로 나눠 노출.
 */

export type RoleTier = 'president' | 'vice_president' | 'officer' | 'member'

export type PublicMember = {
  id: string
  cohort: number
  name: string
  mono_name: string | null
  role_tier: RoleTier
  role_label: string | null
  team: string | null
  college: string | null
  major: string | null
  status: string | null
  bio: string | null
  photo_url: string | null
  sort_order: number
}

export type AdminMember = PublicMember & {
  email: string | null
  phone: string | null
  student_id: string | null
  birth: string | null
  published: boolean
  created_at: string
  updated_at: string
}

const PUBLIC_COLUMNS =
  'id, cohort, name, mono_name, role_tier, role_label, team, college, major, status, bio, photo_url, sort_order'

function toRoleTier(v: unknown): RoleTier {
  return v === 'president' || v === 'vice_president' || v === 'officer'
    ? (v as RoleTier)
    : 'member'
}

function toPublicMember(row: Record<string, unknown>): PublicMember {
  return {
    id: String(row.id),
    cohort: Number(row.cohort),
    name: String(row.name),
    mono_name: (row.mono_name as string | null) ?? null,
    role_tier: toRoleTier(row.role_tier),
    role_label: (row.role_label as string | null) ?? null,
    team: (row.team as string | null) ?? null,
    college: (row.college as string | null) ?? null,
    major: (row.major as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    photo_url: (row.photo_url as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 100),
  }
}

function toAdminMember(row: Record<string, unknown>): AdminMember {
  return {
    ...toPublicMember(row),
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    student_id: (row.student_id as string | null) ?? null,
    birth: (row.birth as string | null) ?? null,
    published: Boolean(row.published),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

const ROLE_ORDER: Record<RoleTier, number> = {
  president: 1,
  vice_president: 2,
  officer: 3,
  member: 4,
}

function sortMembers<T extends { role_tier: RoleTier; sort_order: number; name: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const t = ROLE_ORDER[a.role_tier] - ROLE_ORDER[b.role_tier]
    if (t !== 0) return t
    const s = a.sort_order - b.sort_order
    if (s !== 0) return s
    return a.name.localeCompare(b.name, 'ko')
  })
}

export async function getPublicMembersByCohort(
  cohort: number,
): Promise<PublicMember[]> {
  const { data, error } = await supabaseService
    .from('cohort_members')
    .select(PUBLIC_COLUMNS)
    .eq('cohort', cohort)
    .eq('published', true)
  if (error || !data) return []
  return sortMembers((data as Record<string, unknown>[]).map(toPublicMember))
}

export type PublicLeader = PublicMember & { email: string | null }

/**
 * 회장·부회장은 공식 대표 연락처로 이메일을 함께 노출한다.
 * 일반 학회원의 이메일은 계속 비공개(PublicMember 타입에서 제외).
 */
export async function getPublicLeadership(
  cohort: number,
): Promise<PublicLeader[]> {
  const { data, error } = await supabaseService
    .from('cohort_members')
    .select(`${PUBLIC_COLUMNS}, email`)
    .eq('cohort', cohort)
    .eq('published', true)
    .in('role_tier', ['president', 'vice_president'])
  if (error || !data) return []
  const rows = (data as Record<string, unknown>[]).map((r) => ({
    ...toPublicMember(r),
    email: (r.email as string | null) ?? null,
  }))
  return sortMembers(rows)
}

export async function getPublishedCohortList(): Promise<
  { cohort: number; count: number }[]
> {
  const { data, error } = await supabaseService
    .from('cohort_members')
    .select('cohort')
    .eq('published', true)
  if (error || !data) return []
  const map = new Map<number, number>()
  for (const row of data as { cohort: number }[]) {
    map.set(row.cohort, (map.get(row.cohort) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([cohort, count]) => ({ cohort, count }))
    .sort((a, b) => b.cohort - a.cohort)
}

export async function getAdminMembersByCohort(
  cohort: number,
): Promise<AdminMember[]> {
  const { data, error } = await supabaseService
    .from('cohort_members')
    .select('*')
    .eq('cohort', cohort)
  if (error || !data) return []
  return sortMembers((data as Record<string, unknown>[]).map(toAdminMember))
}

export async function getAdminMemberById(id: string): Promise<AdminMember | null> {
  const { data } = await supabaseService
    .from('cohort_members')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return toAdminMember(data as Record<string, unknown>)
}

export async function getAdminCohortList(): Promise<
  { cohort: number; total: number; published: number }[]
> {
  const { data, error } = await supabaseService
    .from('cohort_members')
    .select('cohort, published')
  if (error || !data) return []
  const map = new Map<number, { total: number; published: number }>()
  for (const row of data as { cohort: number; published: boolean }[]) {
    const entry = map.get(row.cohort) ?? { total: 0, published: 0 }
    entry.total += 1
    if (row.published) entry.published += 1
    map.set(row.cohort, entry)
  }
  return [...map.entries()]
    .map(([cohort, v]) => ({ cohort, ...v }))
    .sort((a, b) => b.cohort - a.cohort)
}
