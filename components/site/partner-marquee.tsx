/**
 * Partner marquee — pre-footer band.
 *
 * Replaces the prior `VeryMarquee` wordmark pattern. Renders the current
 * volume's partner logos as a horizontally-scrolling strip directly above
 * the colophon footer. Tokens are duplicated so the CSS `translateX(-50%)`
 * loop reads seamless; animation is gated by `prefers-reduced-motion`
 * in globals.css.
 *
 * Decorative + informational — `aria-hidden` on the visual loop, but each
 * Image carries an alt so screen readers still get the partner name once
 * (we don't repeat it 16 times).
 */
import Image from 'next/image'
import { PARTNER_LOGOS } from '@/lib/content/partners'

export function PartnerMarquee() {
  return (
    <div
      aria-label="이번 학기 파트너"
      className="relative overflow-hidden border-y border-border bg-bg-base py-6 md:py-10"
    >
      <div className="very-marquee-track flex w-max items-center gap-12 md:gap-20" aria-hidden>
        {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
          <div key={i} className="relative h-10 w-32 shrink-0 md:h-14 md:w-44">
            <Image
              src={logo.src}
              alt=""
              fill
              sizes="(max-width: 768px) 128px, 176px"
              className="object-contain"
            />
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {PARTNER_LOGOS.map((logo) => (
          <li key={logo.name}>{logo.name}</li>
        ))}
      </ul>
    </div>
  )
}
