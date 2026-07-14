import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 파트너 마퀴 배너용 조회. approved + published + marquee_logo_url 있는
 * 파트너만 sort_order 오름차순으로 반환. 마퀴 컴포넌트가 각 페이지 하단에
 * 렌더될 때마다 호출된다.
 *
 * 배너용 로고와 카드용 로고(logo_url)는 별도 컬럼으로 분리:
 * - marquee_logo_url: 다크 배경용 흑백 실루엣 SVG 권장
 * - logo_url: 카드/썸네일용 원본 로고
 */

export type MarqueePartner = {
  id: string
  name: string
  marquee_logo_url: string
}

export async function getMarqueePartners(): Promise<MarqueePartner[]> {
  const { data, error } = await supabaseService
    .from('partners')
    .select('id, name, marquee_logo_url')
    .eq('status', 'approved')
    .eq('published', true)
    .not('marquee_logo_url', 'is', null)
    .order('sort_order', { ascending: true })
  if (error || !data) return []
  return (data as Record<string, unknown>[])
    .filter(
      (r) =>
        typeof r.marquee_logo_url === 'string' && r.marquee_logo_url.length > 0,
    )
    .map((r) => ({
      id: String(r.id),
      name: String(r.name),
      marquee_logo_url: String(r.marquee_logo_url),
    }))
}
