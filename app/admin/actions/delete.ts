'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'
import type { DeleteState } from './delete-state'

function extractStoragePath(url: string | null, bucket: string): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

async function authorize(): Promise<DeleteState | null> {
  try {
    await requireAdmin()
    return null
  } catch (err) {
    console.error('[delete] requireAdmin failed', err)
    return { ok: false, error: '권한이 없습니다.' }
  }
}

export async function deleteAlumni(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }
  const denied = await authorize()
  if (denied) return denied

  const { data: companies, error: cFetchErr } = await supabaseService
    .from('alumni_companies')
    .select('id, logo_url')
    .eq('founder_alumni_id', id)
  if (cFetchErr) {
    console.error('[deleteAlumni] companies fetch failed', cFetchErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  if (companies && companies.length > 0) {
    const { error: cDelErr } = await supabaseService
      .from('alumni_companies')
      .delete()
      .eq('founder_alumni_id', id)
    if (cDelErr) {
      console.error('[deleteAlumni] companies delete failed', cDelErr)
      return { ok: false, error: '회사 정보 삭제에 실패했습니다.' }
    }
  }

  const { error: aDelErr } = await supabaseService
    .from('alumni')
    .delete()
    .eq('id', id)
  if (aDelErr) {
    console.error('[deleteAlumni] alumni delete failed', aDelErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  const logoPaths = (companies ?? [])
    .map((c) => extractStoragePath(c.logo_url, 'alumni-company-logos'))
    .filter((p): p is string => p !== null)
  if (logoPaths.length > 0) {
    const { error: rmErr } = await supabaseService.storage
      .from('alumni-company-logos')
      .remove(logoPaths)
    if (rmErr)
      console.error('[deleteAlumni] logo storage cleanup failed', rmErr)
  }

  revalidatePath('/alumni')
  revalidatePath('/admin/alumni')
  return { ok: true, error: null }
}

export async function deletePartner(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: '잘못된 요청입니다.' }
  const denied = await authorize()
  if (denied) return denied

  const { data: row, error: fetchErr } = await supabaseService
    .from('partners')
    .select('logo_url')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) {
    console.error('[deletePartner] fetch failed', fetchErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  const { error: delErr } = await supabaseService
    .from('partners')
    .delete()
    .eq('id', id)
  if (delErr) {
    console.error('[deletePartner] delete failed', delErr)
    return { ok: false, error: '삭제에 실패했습니다.' }
  }

  const logoPath = extractStoragePath(row?.logo_url ?? null, 'partner-logos')
  if (logoPath) {
    const { error: rmErr } = await supabaseService.storage
      .from('partner-logos')
      .remove([logoPath])
    if (rmErr)
      console.error('[deletePartner] logo storage cleanup failed', rmErr)
  }

  revalidatePath('/admin/partners')
  revalidatePath('/', 'layout')
  return { ok: true, error: null }
}
