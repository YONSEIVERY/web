import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type CompanyStage = 'idea' | 'seed' | 'seriesA' | 'seriesB' | 'growth' | 'exit'

export interface AlumniCompany {
  id: string
  founderAlumniId: string | null
  name: string
  logoUrl: string
  oneLiner: string
  stage: CompanyStage | null
  websiteUrl: string | null
}

export interface Alumni {
  id: string
  name: string
  cohort: number
  jobTitle: string
  bio: string
  linkedinUrl: string | null
  companies: AlumniCompany[]
}

export async function getAlumni(): Promise<Alumni[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('alumni')
      .select(`
        id, name, cohort, job_title, bio, linkedin_url,
        alumni_companies!alumni_companies_founder_alumni_id_fkey (
          id, founder_alumni_id, name, logo_url, one_liner, stage, website_url, status, published
        )
      `)
      .order('cohort', { ascending: false })
      .order('name', { ascending: true })
    if (error || !data) return []
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      cohort: r.cohort,
      jobTitle: r.job_title,
      bio: r.bio,
      linkedinUrl: r.linkedin_url,
      companies: (r.alumni_companies as Array<{
        id: string
        founder_alumni_id: string
        name: string
        logo_url: string
        one_liner: string
        stage: string | null
        website_url: string | null
        status: string
        published: boolean
      }>)
        .filter((c) => c.status === 'approved' && c.published)
        .map((c) => ({
          id: c.id,
          founderAlumniId: c.founder_alumni_id,
          name: c.name,
          logoUrl: c.logo_url,
          oneLiner: c.one_liner,
          stage: c.stage as CompanyStage | null,
          websiteUrl: c.website_url,
        })),
    }))
  } catch {
    return []
  }
}

export async function getAlumniCompanies(): Promise<AlumniCompany[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('alumni_companies')
      .select('id, founder_alumni_id, name, logo_url, one_liner, stage, website_url')
      .order('name', { ascending: true })
    if (error || !data) return []
    return data.map((c) => ({
      id: c.id,
      founderAlumniId: c.founder_alumni_id,
      name: c.name,
      logoUrl: c.logo_url,
      oneLiner: c.one_liner,
      stage: c.stage as CompanyStage | null,
      websiteUrl: c.website_url,
    }))
  } catch {
    return []
  }
}
