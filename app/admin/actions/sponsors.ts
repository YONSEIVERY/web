'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import type { SponsorActionState } from './sponsors-state'

/**
 * 후원자 CRUD. 마케팅 페이지(/alumni)와 목록/상세(어드민) 재검증까지
 * 한 번에 처리한다. 삭제 후에는 목록으로 리다이렉트.
 */

const KINDS = new Set(['individual', 'company'])
const CATEGORIES = new Set(['prize', 'operations'])

function parseCommon(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const kind = String(formData.get('kind') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const cohortLabel =
    String(formData.get('cohort_label') ?? '').trim() || null
  const note = String(formData.get('note') ?? '').trim() || null
  const orderIndexRaw = String(formData.get('order_index') ?? '0').trim()
  const orderIndex = Number.parseInt(orderIndexRaw, 10)
  if (!name) throw new Error('이름을 입력해주세요.')
  if (!KINDS.has(kind)) throw new Error('종류(개인/기업)를 선택해주세요.')
  if (!CATEGORIES.has(category))
    throw new Error('카테고리(상금/운영)를 선택해주세요.')
  if (!Number.isFinite(orderIndex))
    throw new Error('순서를 숫자로 입력해주세요.')
  return { name, kind, category, cohortLabel, note, orderIndex }
}

export async function createSponsor(
  _prev: SponsorActionState,
  formData: FormData,
): Promise<SponsorActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  let parsed
  try {
    parsed = parseCommon(formData)
  } catch (e) {
    return { status: 'error', message: (e as Error).message }
  }
  const { error } = await supabaseService.from('sponsors').insert({
    name: parsed.name,
    kind: parsed.kind,
    category: parsed.category,
    cohort_label: parsed.cohortLabel,
    note: parsed.note,
    order_index: parsed.orderIndex,
  })
  if (error) {
    console.error('[createSponsor] failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/admin/sponsors')
  revalidatePath('/alumni')
  redirect('/admin/sponsors' as Route)
}

export async function updateSponsor(
  _prev: SponsorActionState,
  formData: FormData,
): Promise<SponsorActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  let parsed
  try {
    parsed = parseCommon(formData)
  } catch (e) {
    return { status: 'error', message: (e as Error).message }
  }
  const { error } = await supabaseService
    .from('sponsors')
    .update({
      name: parsed.name,
      kind: parsed.kind,
      category: parsed.category,
      cohort_label: parsed.cohortLabel,
      note: parsed.note,
      order_index: parsed.orderIndex,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('[updateSponsor] failed', error)
    return { status: 'error', message: '저장에 실패했습니다.' }
  }
  revalidatePath('/admin/sponsors')
  revalidatePath('/alumni')
  return { status: 'success', message: '저장되었습니다.' }
}

export async function deleteSponsor(
  _prev: SponsorActionState,
  formData: FormData,
): Promise<SponsorActionState> {
  try {
    await requireAdmin()
  } catch {
    return { status: 'error', message: '권한이 없습니다.' }
  }
  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: '잘못된 요청입니다.' }
  const { error } = await supabaseService.from('sponsors').delete().eq('id', id)
  if (error) {
    console.error('[deleteSponsor] failed', error)
    return { status: 'error', message: '삭제에 실패했습니다.' }
  }
  revalidatePath('/admin/sponsors')
  revalidatePath('/alumni')
  redirect('/admin/sponsors' as Route)
}
