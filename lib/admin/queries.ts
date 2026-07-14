import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

export async function getAdminCounts() {
  const [alumniPending, partnerPending, inquiriesNew, demodayCurrentAttendees] =
    await Promise.all([
      supabaseService.from('alumni').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseService.from('partners').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseService.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      currentDemodayAttendeeCount(),
    ])
  return {
    alumniPending: alumniPending.count ?? 0,
    partnerPending: partnerPending.count ?? 0,
    inquiriesNew: inquiriesNew.count ?? 0,
    demodayCurrentAttendees,
  }
}

async function currentDemodayAttendeeCount(): Promise<number> {
  const { data } = await supabaseService
    .from('demoday_events')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()
  if (!data) return 0
  const { count } = await supabaseService
    .from('demoday_attendees')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', (data as { id: string }).id)
  return count ?? 0
}

export async function getPendingApplications() {
  const [alumni, partners] = await Promise.all([
    supabaseService
      .from('alumni')
      .select(`
        id, name, cohort, job_title, created_at,
        alumni_companies!alumni_companies_founder_alumni_id_fkey ( id, name )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabaseService
      .from('partners')
      .select('id, name, category, applicant_name, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ])
  return {
    alumni: alumni.data ?? [],
    partners: partners.data ?? [],
  }
}

export async function getApplicationDetail(type: 'alumni' | 'partner', id: string) {
  if (type === 'alumni') {
    const { data } = await supabaseService
      .from('alumni')
      .select(`
        *, alumni_companies!alumni_companies_founder_alumni_id_fkey ( * )
      `)
      .eq('id', id)
      .maybeSingle()
    return data
  }
  const { data } = await supabaseService
    .from('partners')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function getInquiries() {
  const { data } = await supabaseService
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getApprovedAlumni() {
  const { data } = await supabaseService
    .from('alumni')
    .select('id, name, cohort, job_title, published')
    .eq('status', 'approved')
    .order('cohort', { ascending: false })
  return data ?? []
}

export async function getApprovedPartners() {
  const { data } = await supabaseService
    .from('partners')
    .select('id, name, category, published, sort_order, marquee_logo_url')
    .eq('status', 'approved')
    .order('sort_order', { ascending: true })
  return data ?? []
}
