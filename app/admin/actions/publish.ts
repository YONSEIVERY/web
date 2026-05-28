'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'

export type ToggleState = { ok: boolean; error: string | null }
export const TOGGLE_INITIAL: ToggleState = { ok: false, error: null }

function readArgs(formData: FormData): { id: string; value: boolean } | null {
  const id = String(formData.get('id') ?? '')
  const rawValue = String(formData.get('value') ?? '')
  if (!id) return null
  return { id, value: rawValue === 'true' }
}

async function authorize(): Promise<ToggleState | null> {
  try {
    await requireAdmin()
    return null
  } catch (err) {
    console.error('[publish toggle] requireAdmin failed', err)
    return { ok: false, error: '권한이 없습니다.' }
  }
}

export async function toggleAlumniPublished(
  _prev: ToggleState,
  formData: FormData,
): Promise<ToggleState> {
  const args = readArgs(formData)
  if (!args) return { ok: false, error: '잘못된 요청입니다.' }
  const denied = await authorize()
  if (denied) return denied
  const { error } = await supabaseService
    .from('alumni')
    .update({ published: args.value })
    .eq('id', args.id)
  if (error) {
    console.error('[toggleAlumniPublished] alumni update failed', error)
    return { ok: false, error: '저장에 실패했습니다.' }
  }
  revalidatePath('/alumni')
  revalidatePath('/admin/alumni')
  return { ok: true, error: null }
}

export async function toggleAlumniCompanyPublished(
  _prev: ToggleState,
  formData: FormData,
): Promise<ToggleState> {
  const args = readArgs(formData)
  if (!args) return { ok: false, error: '잘못된 요청입니다.' }
  const denied = await authorize()
  if (denied) return denied
  const { error } = await supabaseService
    .from('alumni_companies')
    .update({ published: args.value })
    .eq('id', args.id)
  if (error) {
    console.error('[toggleAlumniCompanyPublished] alumni_companies update failed', error)
    return { ok: false, error: '저장에 실패했습니다.' }
  }
  revalidatePath('/alumni')
  revalidatePath('/admin/alumni')
  return { ok: true, error: null }
}

export async function togglePartnerPublished(
  _prev: ToggleState,
  formData: FormData,
): Promise<ToggleState> {
  const args = readArgs(formData)
  if (!args) return { ok: false, error: '잘못된 요청입니다.' }
  const denied = await authorize()
  if (denied) return denied
  const { error } = await supabaseService
    .from('partners')
    .update({ published: args.value })
    .eq('id', args.id)
  if (error) {
    console.error('[togglePartnerPublished] partners update failed', error)
    return { ok: false, error: '저장에 실패했습니다.' }
  }
  revalidatePath('/partners')
  revalidatePath('/admin/partners')
  return { ok: true, error: null }
}
