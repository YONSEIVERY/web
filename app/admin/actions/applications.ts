'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'

export async function approveAlumni(id: string) {
  await requireAdmin()
  const now = new Date().toISOString()
  await supabaseService.from('alumni').update({ status: 'approved', published: true, approved_at: now }).eq('id', id)
  await supabaseService.from('alumni_companies').update({ status: 'approved', published: true, approved_at: now }).eq('founder_alumni_id', id)
  revalidatePath('/alumni')
  revalidatePath('/admin/applications')
}

export async function approvePartner(id: string) {
  await requireAdmin()
  await supabaseService.from('partners').update({
    status: 'approved', published: true, approved_at: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/partners')
  revalidatePath('/admin/applications')
}

export async function rejectApplication(type: 'alumni' | 'partner', id: string, reason: string) {
  await requireAdmin()
  if (type === 'alumni') {
    await supabaseService.from('alumni').update({ status: 'rejected', reject_reason: reason }).eq('id', id)
    await supabaseService.from('alumni_companies').update({ status: 'rejected', reject_reason: reason }).eq('founder_alumni_id', id)
  } else {
    await supabaseService.from('partners').update({ status: 'rejected', reject_reason: reason }).eq('id', id)
  }
  revalidatePath('/admin/applications')
}
