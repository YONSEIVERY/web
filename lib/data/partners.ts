import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type PartnerCategory = 'CORPORATE' | 'CAPITAL' | 'ACADEMIC'

export interface Partner {
  id: string
  name: string
  category: PartnerCategory
  oneLiner: string
  logoUrl: string | null
  sortOrder: number
}

export async function getPartners(): Promise<Partner[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('partners')
      .select('id, name, category, one_liner, logo_url, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error || !data) return []
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as PartnerCategory,
      oneLiner: r.one_liner,
      logoUrl: r.logo_url,
      sortOrder: r.sort_order,
    }))
  } catch {
    return []
  }
}
