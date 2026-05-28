'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'

const APPLICATIONS_QUEUE = '/admin/applications' as Route

export async function approveAlumni(id: string) {
  await requireAdmin()
  const now = new Date().toISOString()
  const { error: aErr } = await supabaseService
    .from('alumni')
    .update({ status: 'approved', published: true, approved_at: now })
    .eq('id', id)
  if (aErr) {
    console.error('[approveAlumni] alumni update failed', aErr)
    throw new Error('approve failed')
  }
  const { error: cErr } = await supabaseService
    .from('alumni_companies')
    .update({ status: 'approved', published: true, approved_at: now })
    .eq('founder_alumni_id', id)
  if (cErr) {
    console.error('[approveAlumni] alumni_companies update failed', cErr)
    throw new Error('approve failed')
  }
  revalidatePath('/alumni')
  revalidatePath('/admin/applications')
  redirect(APPLICATIONS_QUEUE)
}

export async function approvePartner(id: string) {
  await requireAdmin()
  const { error } = await supabaseService
    .from('partners')
    .update({ status: 'approved', published: true, approved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    console.error('[approvePartner] partners update failed', error)
    throw new Error('approve failed')
  }
  revalidatePath('/partners')
  revalidatePath('/admin/applications')
  redirect(APPLICATIONS_QUEUE)
}

export async function rejectApplication(type: 'alumni' | 'partner', id: string, reason: string) {
  await requireAdmin()
  if (type === 'alumni') {
    const { error: aErr } = await supabaseService
      .from('alumni')
      .update({ status: 'rejected', reject_reason: reason })
      .eq('id', id)
    if (aErr) {
      console.error('[rejectApplication] alumni update failed', aErr)
      throw new Error('reject failed')
    }
    const { error: cErr } = await supabaseService
      .from('alumni_companies')
      .update({ status: 'rejected', reject_reason: reason })
      .eq('founder_alumni_id', id)
    if (cErr) {
      console.error('[rejectApplication] alumni_companies update failed', cErr)
      throw new Error('reject failed')
    }
  } else {
    const { error } = await supabaseService
      .from('partners')
      .update({ status: 'rejected', reject_reason: reason })
      .eq('id', id)
    if (error) {
      console.error('[rejectApplication] partners update failed', error)
      throw new Error('reject failed')
    }
  }
  revalidatePath('/admin/applications')
  redirect(APPLICATIONS_QUEUE)
}
