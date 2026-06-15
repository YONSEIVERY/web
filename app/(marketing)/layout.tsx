import { SiteNav } from '@/components/site/site-nav'
import { SiteFooter } from '@/components/site/site-footer'
import { VeryMarquee } from '@/components/site/very-marquee'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <VeryMarquee />
      <SiteFooter />
    </>
  )
}
