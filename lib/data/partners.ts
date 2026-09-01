import 'server-only'
import { supabaseAnon } from '@/lib/supabase/anon'

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
    // 쿠키 없는 anon 클라이언트. site-config.ts와 같은 이유다. 이 함수는
    // 레이아웃의 파트너 마퀴가 부르므로 공개 사이트 전체의 정적화를 좌우한다.
    const { data, error } = await supabaseAnon
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
