import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 후원자 명예의 전당 — /alumni 하단 노출 + /admin/sponsors 관리.
 * 데모데이 상금 / 운영자금 두 카테고리로 나뉜다. 금액은 저장·노출
 * 하지 않는다(명예 목적).
 */

export type SponsorKind = 'individual' | 'company'
export type SponsorCategory = 'prize' | 'operations'

export type Sponsor = {
  id: string
  name: string
  kind: SponsorKind
  category: SponsorCategory
  cohort_label: string | null
  note: string | null
  order_index: number
  created_at: string
  updated_at: string
}

function toSponsor(row: Record<string, unknown>): Sponsor {
  const kind = row.kind === 'company' ? 'company' : 'individual'
  const category = row.category === 'operations' ? 'operations' : 'prize'
  return {
    id: String(row.id),
    name: String(row.name),
    kind,
    category,
    cohort_label: (row.cohort_label as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    order_index: Number(row.order_index ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function getSponsors(): Promise<Sponsor[]> {
  const { data } = await supabaseService
    .from('sponsors')
    .select('*')
    .order('category', { ascending: true })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
  if (!data) return []
  return (data as Record<string, unknown>[]).map(toSponsor)
}

export async function getSponsorById(id: string): Promise<Sponsor | null> {
  const { data } = await supabaseService
    .from('sponsors')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return toSponsor(data as Record<string, unknown>)
}
