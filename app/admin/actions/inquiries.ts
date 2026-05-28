'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'

export async function updateInquiryStatus(id: string, status: 'new' | 'in_progress' | 'done') {
  await requireAdmin()
  const { error } = await supabaseService.from('inquiries').update({ status }).eq('id', id)
  if (error) {
    console.error('[updateInquiryStatus] inquiries update failed', error)
    throw new Error('update failed')
  }
  revalidatePath('/admin/inquiries')
}
