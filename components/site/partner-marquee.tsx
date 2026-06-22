/**
 * Partner marquee — pre-footer band.
 *
 * Renders the current volume's partner logos as a horizontally-scrolling
 * strip directly above the colophon footer. Tokens are duplicated so the
 * CSS `translateX(-50%)` loop reads seamless; animation is gated by
 * `prefers-reduced-motion` in globals.css.
 *
 * Sizing: each logo gets a fixed height with `w-auto` so its native
 * aspect ratio is preserved — fitting variable-shape SVGs into a fixed
 * box (Image with `fill` + `object-contain`) leaves visible whitespace
 * around square marks. Plain `<img>` is used instead of next/image
 * because (a) SVG doesn't benefit from raster optimization and (b) we
 * need width to follow each SVG's intrinsic aspect.
 *
 * Decorative + informational — `aria-hidden` on the visual loop, but
 * each logo's name is exposed once via the sr-only list below so screen
 * readers don't have to read it 16 times.
 */
import { PARTNER_LOGOS } from '@/lib/content/partners'

export function PartnerMarquee() {
  return (
    <section
      aria-label="이번 학기 협력사"
      className="relative overflow-hidden border-y border-border bg-bg-base py-6 md:py-10"
    >
      <div className="mb-4 flex items-center justify-between px-6 md:mb-6 md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted md:text-xs">
          Partners — Vol.43
        </p>
        <p className="text-xs text-fg-muted md:text-sm">
          이번 학기를 함께 받치는 협력사
        </p>
      </div>
      <div className="very-marquee-track flex w-max items-center gap-14 md:gap-24" aria-hidden>
        {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={logo.src}
            alt=""
            className={`block h-12 w-auto shrink-0 md:h-20${logo.invert ? ' brightness-0 invert' : ''}`}
          />
        ))}
      </div>
      <ul className="sr-only">
        {PARTNER_LOGOS.map((logo) => (
          <li key={logo.name}>{logo.name}</li>
        ))}
      </ul>
    </section>
  )
}
