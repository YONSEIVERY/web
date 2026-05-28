'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'

export async function toggleAlumniPublished(id: string, value: boolean) {
  await requireAdmin()
  const { error } = await supabaseService.from('alumni').update({ published: value }).eq('id', id)
  if (error) {
    console.error('[toggleAlumniPublished] alumni update failed', error)
    throw new Error('toggle failed')
  }
  revalidatePath('/alumni')
  revalidatePath('/admin/alumni')
}

export async function toggleAlumniCompanyPublished(id: string, value: boolean) {
  await requireAdmin()
  const { error } = await supabaseService.from('alumni_companies').update({ published: value }).eq('id', id)
  if (error) {
    console.error('[toggleAlumniCompanyPublished] alumni_companies update failed', error)
    throw new Error('toggle failed')
  }
  revalidatePath('/alumni')
  revalidatePath('/admin/alumni')
}

export async function togglePartnerPublished(id: string, value: boolean) {
  await requireAdmin()
  const { error } = await supabaseService.from('partners').update({ published: value }).eq('id', id)
  if (error) {
    console.error('[togglePartnerPublished] partners update failed', error)
    throw new Error('toggle failed')
  }
  revalidatePath('/partners')
  revalidatePath('/admin/partners')
}
