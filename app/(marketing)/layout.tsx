import { SiteNav } from '@/components/site/site-nav'
import { SiteFooter } from '@/components/site/site-footer'
import { PartnerMarquee } from '@/components/site/partner-marquee'

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
