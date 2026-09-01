import { SiteNav } from '@/components/site/site-nav'
import { SiteFooter } from '@/components/site/site-footer'
import { PartnerMarquee } from '@/components/site/partner-marquee'

// 공개 사이트 전체를 ISR로 굳힌다. 데이터 계층이 쿠키를 떼면서 정적 렌더가
// 가능해졌고, 5분 재검증이면 기수 표기나 파트너 변경이 재배포 없이 따라온다.
// /recruit처럼 force-dynamic을 선언한 페이지는 이 값의 영향을 받지 않는다.
export const revalidate = 300

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <PartnerMarquee />
      <SiteFooter />
    </>
  )
}
