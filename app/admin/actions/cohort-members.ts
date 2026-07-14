'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import type { CohortMemberActionState } from './cohort-members-state'

/**
 * 학회원 CRUD + 프로필 사진 업로드. 회장·부회장·임원진·일반을
 * role_tier 하나로 구분해 관리한다. 사진은 storage bucket
 * `cohort-member-photos` 사용, 5MB · PNG/JPEG/WEBP 제한.
 *
 * mutation 후에는 관련 페이지 재검증:
 *  - /admin/members (목록 · 상세)
 *  - / (marketing layout — 아직 진입 링크는 없지만 향후 대비)
 *  - /about  · /cohorts/[cohort]  (public 소비처)
 */

const ROLE_TIERS = new Set([
  'president',
  'vice_president',
  'officer',
  'member',
])

const PHOTO_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

type Parsed = {
  cohort: number
  name: string
  monoName: string | null
  roleTier: string
  roleLabel: string | null
  team: string | null
  college: string | null
  major: string | null
  status: string | null
  bio: string | null
  email: string | null
  phone: string | null
  studentId: string | null
  birth: string | null
  sortOrder: number
  published: boolean
}

function pick(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? '').trim()
  return v.length === 0 ? null : v
}

function parseCommon(formData: FormData): Parsed {
  const cohortRaw = String(formData.get('cohort') ?? '').trim()
  const cohort = Number.parseInt(cohortRaw, 10)
  const name = String(formData.get('name') ?? '').trim()
  const roleTier = String(formData.get('role_tier') ?? '').trim()
  const sortOrderRaw = String(formData.get('sort_order') ?? '100').trim()
  const sortOrder = Number.parseInt(sortOrderRaw, 10)
  const email = pick(formData, 'email')
  if (!Number.isInteger(cohort) || cohort < 1 || cohort > 100)
    throw new Error('기수를 1~100 사이 정수로 입력해주세요.')
  if (!name) throw new Error('이름을 입력해주세요.')
  if (!ROLE_TIERS.has(roleTier))
    throw new Error('역할 구분(회장/부회장/임원/일반)을 선택해주세요.')
  if (!Number.isFinite(sortOrder))
    throw new Error('정렬 순서를 숫자로 입력해주세요.')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('이메일 형식이 올바르지 않습니다.')
  return {
    cohort,
    name,
    monoName: pick(formData, 'mono_name'),
    roleTier,
    roleLabel: pick(formData, 'role_label'),
    team: pick(formData, 'team'),
    college: pick(formData, 'college'),
    major: pick(formData, 'major'),
    status: pick(formData, 'status'),
    bio: pick(formData, 'bio'),
    email,
    phone: pick(formData, 'phone'),
    studentId: pick(formData, 'student_id'),
    birth: pick(formData, 'birth'),
    sortOrder,
    published: formData.get('published') === 'on',
  }
}

function revalidateAll(id: string, cohort: number) {
  revalidatePath('/admin/members')
  revalidatePath(`/admin/members/${id}`)
  revalidatePath('/about')
  revalidatePath('/cohorts')
  revalidatePath(`/cohorts/${cohort}`)
}

export async function createMember(
  _prev: CohortMemberActionState,
  formData: FormData,
): Promise<CohortMemberActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  let parsed: Parsed
  try {
    parsed = parseCommon(formData)
  } catch (e) {
    return { status: 'error', message: (e as Error).message }
  }
  const { data, error } = await supabaseService
    .from('cohort_members')
    .insert({
      cohort: parsed.cohort,
      name: parsed.name,
      mono_name: parsed.monoName,
      role_tier: parsed.roleTier,
      role_label: parsed.roleLabel,
      team: parsed.team,
      college: parsed.college,
      major: parsed.major,
      status: parsed.status,
      bio: parsed.bio,
      email: parsed.email,
      phone: parsed.phone,
      student_id: parsed.studentId,
      birth: parsed.birth,
      sort_order: parsed.sortOrder,
      published: parsed.published,
    })
    .select('id')
    .maybeSingle()
  if (error || !data) {
    console.error('[createMember] failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidateAll((data as { id: string }).id, parsed.cohort)
  redirect(`/admin/members/${(data as { id: string }).id}` as Route)
}

export async function updateMember(
  _prev: CohortMemberActionState,
  formData: FormData,
): Promise<CohortMemberActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  let parsed: Parsed
  try {
    parsed = parseCommon(formData)
  } catch (e) {
    return { status: 'error', message: (e as Error).message }
  }
  const { error } = await supabaseService
    .from('cohort_members')
    .update({
      cohort: parsed.cohort,
      name: parsed.name,
      mono_name: parsed.monoName,
      role_tier: parsed.roleTier,
      role_label: parsed.roleLabel,
      team: parsed.team,
      college: parsed.college,
      major: parsed.major,
      status: parsed.status,
      bio: parsed.bio,
      email: parsed.email,
      phone: parsed.phone,
      student_id: parsed.studentId,
      birth: parsed.birth,
      sort_order: parsed.sortOrder,
      published: parsed.published,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('[updateMember] failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidateAll(id, parsed.cohort)
  return { status: 'success', message: '저장되었습니다.' }
}

function extractStoragePath(url: string | null, bucket: string): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export async function uploadMemberPhoto(
  _prev: CohortMemberActionState,
  formData: FormData,
): Promise<CohortMemberActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  const file = formData.get('photo') as File | null
  if (!file || file.size === 0)
    return { status: 'error', message: '사진 파일을 선택해주세요.' }
  if (file.size > MAX_PHOTO_BYTES)
    return { status: 'error', message: '5MB 이하로 올려주세요.' }
  if (!PHOTO_MIME.has(file.type))
    return { status: 'error', message: 'PNG/JPEG/WEBP만 허용됩니다.' }

  // fetch cohort for revalidation path
  const { data: row } = await supabaseService
    .from('cohort_members')
    .select('cohort, photo_url')
    .eq('id', id)
    .maybeSingle()
  const cohort = (row as { cohort?: number } | null)?.cohort ?? 43
  const oldPhotoUrl = (row as { photo_url?: string | null } | null)?.photo_url ?? null

  const supabase = await createClient()
  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : 'jpg'
  const path = `${cohort}/${id}/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await supabase.storage
    .from('cohort-member-photos')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (upErr) {
    console.error('[uploadMemberPhoto] upload failed', upErr)
    return { status: 'error', message: '업로드에 실패했습니다.' }
  }
  const { data: pub } = supabase.storage
    .from('cohort-member-photos')
    .getPublicUrl(path)

  const { error: dbErr } = await supabaseService
    .from('cohort_members')
    .update({ photo_url: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (dbErr) {
    console.error('[uploadMemberPhoto] db update failed', dbErr)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }

  // 이전 사진 정리 (best-effort)
  const oldPath = extractStoragePath(oldPhotoUrl, 'cohort-member-photos')
  if (oldPath && oldPath !== path) {
    const { error: rmErr } = await supabaseService.storage
      .from('cohort-member-photos')
      .remove([oldPath])
    if (rmErr) console.error('[uploadMemberPhoto] old cleanup failed', rmErr)
  }

  revalidateAll(id, cohort)
  return { status: 'success', message: '사진이 교체되었습니다.' }
}

export async function deleteMemberPhoto(
  _prev: CohortMemberActionState,
  formData: FormData,
): Promise<CohortMemberActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  const { data: row } = await supabaseService
    .from('cohort_members')
    .select('cohort, photo_url')
    .eq('id', id)
    .maybeSingle()
  const cohort = (row as { cohort?: number } | null)?.cohort ?? 43
  const oldPhotoUrl = (row as { photo_url?: string | null } | null)?.photo_url ?? null

  const { error: dbErr } = await supabaseService
    .from('cohort_members')
    .update({ photo_url: null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (dbErr) {
    console.error('[deleteMemberPhoto] db update failed', dbErr)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  const oldPath = extractStoragePath(oldPhotoUrl, 'cohort-member-photos')
  if (oldPath) {
    const { error: rmErr } = await supabaseService.storage
      .from('cohort-member-photos')
      .remove([oldPath])
    if (rmErr) console.error('[deleteMemberPhoto] cleanup failed', rmErr)
  }
  revalidateAll(id, cohort)
  return { status: 'success', message: '사진이 삭제되었습니다.' }
}

export async function deleteMember(
  _prev: CohortMemberActionState,
  formData: FormData,
): Promise<CohortMemberActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  const { data: row } = await supabaseService
    .from('cohort_members')
    .select('cohort, photo_url')
    .eq('id', id)
    .maybeSingle()
  const cohort = (row as { cohort?: number } | null)?.cohort ?? 43
  const photoUrl = (row as { photo_url?: string | null } | null)?.photo_url ?? null

  const { error } = await supabaseService
    .from('cohort_members')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('[deleteMember] failed', error)
    return { status: 'error', message: '삭제에 실패했습니다.' }
  }
  const oldPath = extractStoragePath(photoUrl, 'cohort-member-photos')
  if (oldPath) {
    const { error: rmErr } = await supabaseService.storage
      .from('cohort-member-photos')
      .remove([oldPath])
    if (rmErr) console.error('[deleteMember] cleanup failed', rmErr)
  }
  revalidatePath('/admin/members')
  revalidatePath('/about')
  revalidatePath('/cohorts')
  revalidatePath(`/cohorts/${cohort}`)
  redirect('/admin/members' as Route)
}
