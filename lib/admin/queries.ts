import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

export async function getAdminCounts() {
  const [alumniPending, partnerPending, inquiriesNew] = await Promise.all([
    supabaseService.from('alumni').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseService.from('partners').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseService.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])
  return {
    alumniPending: alumniPending.count ?? 0,
    partnerPending: partnerPending.count ?? 0,
    inquiriesNew: inquiriesNew.count ?? 0,
  }
}
