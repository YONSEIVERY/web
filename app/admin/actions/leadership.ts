'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import type { LeadershipActionState } from './leadership-state'

/**
 * 회장단 CRUD. /about 페이지의 LEADERSHIP 섹션이 이 테이블을 조회하므로,
 * mutation 후에는 /admin/leadership과 /about 양쪽을 revalidate.
 */

type Parsed = {
  roleMono: string
  role: string
  name: string
  monoName: string
  email: string | null
  cohortLabel: string | null
  sortOrder: number
}

function parseCommon(formData: FormData): Parsed {
  const roleMono = String(formData.get('role_mono') ?? '').trim()
  const role = String(formData.get('role') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  const monoName = String(formData.get('mono_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim() || null
  const cohortLabel = String(formData.get('cohort_label') ?? '').trim() || null
  const sortOrderRaw = String(formData.get('sort_order') ?? '100').trim()
  const sortOrder = Number.parseInt(sortOrderRaw, 10)
  if (!roleMono) throw new Error('영문 직함 라벨을 입력해주세요.')
  if (!role) throw new Error('한글 직함을 입력해주세요.')
  if (!name) throw new Error('이름(한글)을 입력해주세요.')
  if (!monoName) throw new Error('이름(영문)을 입력해주세요.')
  if (!Number.isFinite(sortOrder))
    throw new Error('정렬 순서를 숫자로 입력해주세요.')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('이메일 형식이 올바르지 않습니다.')
  return {
    roleMono,
    role,
    name,
    monoName,
    email,
    cohortLabel,
    sortOrder,
  }
}

export async function createLeader(
  _prev: LeadershipActionState,
  formData: FormData,
): Promise<LeadershipActionState> {
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
  const { error } = await supabaseService.from('leadership').insert({
    role_mono: parsed.roleMono,
    role: parsed.role,
    name: parsed.name,
    mono_name: parsed.monoName,
    email: parsed.email,
    cohort_label: parsed.cohortLabel,
    sort_order: parsed.sortOrder,
  })
  if (error) {
    console.error('[createLeader] failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/admin/leadership')
  revalidatePath('/about')
  redirect('/admin/leadership' as Route)
}

export async function updateLeader(
  _prev: LeadershipActionState,
  formData: FormData,
): Promise<LeadershipActionState> {
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
    .from('leadership')
    .update({
      role_mono: parsed.roleMono,
      role: parsed.role,
      name: parsed.name,
      mono_name: parsed.monoName,
      email: parsed.email,
      cohort_label: parsed.cohortLabel,
      sort_order: parsed.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('[updateLeader] failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/admin/leadership')
  revalidatePath(`/admin/leadership/${id}`)
  revalidatePath('/about')
  return { status: 'success', message: '저장되었습니다.' }
}

export async function deleteLeader(
  _prev: LeadershipActionState,
  formData: FormData,
): Promise<LeadershipActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  const { error } = await supabaseService
    .from('leadership')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('[deleteLeader] failed', error)
    return { status: 'error', message: '삭제에 실패했습니다.' }
  }
  revalidatePath('/admin/leadership')
  revalidatePath('/about')
  redirect('/admin/leadership' as Route)
}
