import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 회장단 — /about LEADERSHIP 섹션 + /admin/leadership.
 * sort_order 오름차순으로 노출.
 */

export type Leader = {
  id: string
  role_mono: string
  role: string
  name: string
  mono_name: string
  email: string | null
  cohort_label: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

function toLeader(row: Record<string, unknown>): Leader {
  return {
    id: String(row.id),
    role_mono: String(row.role_mono),
    role: String(row.role),
    name: String(row.name),
    mono_name: String(row.mono_name),
    email: (row.email as string | null) ?? null,
    cohort_label: (row.cohort_label as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 100),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function getLeadership(): Promise<Leader[]> {
  const { data, error } = await supabaseService
    .from('leadership')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  // 마이그레이션 미적용/테이블 부재 시 조용히 빈 배열 (호출측 fallback).
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(toLeader)
}

export async function getLeaderById(id: string): Promise<Leader | null> {
  const { data } = await supabaseService
    .from('leadership')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return toLeader(data as Record<string, unknown>)
}
