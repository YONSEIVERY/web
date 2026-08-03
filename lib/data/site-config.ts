import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface SiteConfig {
  cohort: number
  year: number
  semester: '1학기' | '2학기'
  sinceYear: number
}

const FALLBACK: SiteConfig = {
  cohort: 44,
  year: 2026,
  semester: '2학기',
  sinceYear: 1997,
}

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_config')
      .select('cohort, year, semester, since_year')
      .eq('key', 'current')
      .maybeSingle()
    if (error || !data) return FALLBACK
    return {
      cohort: data.cohort,
      year: data.year,
      semester: data.semester as '1학기' | '2학기',
      sinceYear: data.since_year,
    }
  } catch {
    return FALLBACK
  }
})


/** "Vol.44 / 2026-2" 형태의 볼륨 라벨. 히어로 아이브로우 등에서 사용. */
export function volLabel(config: SiteConfig): string {
  const digit = config.semester === '1학기' ? '1' : '2'
  return `Vol.${config.cohort} / ${config.year}-${digit}`
}
