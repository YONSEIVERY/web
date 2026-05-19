import Image from 'next/image'
import Link from 'next/link'
import veryMark from '@/public/brand/very-mark.png'
import { SiteNavLinks } from './site-nav-links'

/**
 * Site Nav — fixed top, RSC, CSS-only.
 *
 * Editorial cinematic tone: VERY mono wordmark on the left, mono caps links
 * on the right. Mobile collapses the link list into a <details>/<summary>
 * disclosure so we keep this a pure server component (no client JS).
 *
 * z-index: nav sits at 50 (under NoiseLayer at 60, above content at 0–40).
 * Background fades in via scroll-driven animation past hero (see globals.css);
 * fallback browsers see a steady, lightly translucent backdrop the whole way.
 */
export function SiteNav() {
  return (
    <header className="site-nav fixed inset-x-0 top-0 z-50">
      <div className="site-nav-bg absolute inset-0 -z-10" aria-hidden />
      <div className="mx-auto flex h-14 items-center justify-between px-6 md:h-16 md:px-10">
        <Link href="/" aria-label="VERY 홈" className="inline-flex items-center">
          <Image
            src={veryMark}
            alt="VERY"
            priority
            className="h-6 w-auto md:h-7"
          />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <SiteNavLinks variant="desktop" />
        </nav>

        <details className="site-nav-disclosure relative md:hidden">
          <summary
            translate="no"
            className="list-none font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary [&::-webkit-details-marker]:hidden"
          >
            MENU
          </summary>
          <nav
            aria-label="Primary mobile"
            className="absolute right-0 top-full mt-3 min-w-[14rem] border border-border-strong bg-bg-base/95 px-5 py-4 backdrop-blur-md"
          >
            <SiteNavLinks variant="mobile" />
          </nav>
        </details>
      </div>
    </header>
  )
}
