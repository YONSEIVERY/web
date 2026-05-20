/**
 * VERY marquee — pre-footer pattern band.
 *
 * Repeats the wordmark in large display caps as a brand pattern strip
 * directly above the colophon footer. This is the BI "VERY 반복 패턴"
 * visual code from the BI doc: the brand name as kinetic wallpaper,
 * not as a logo. Tokens are duplicated so the CSS `translateX(-50%)`
 * loop reads seamless; animation is gated by `prefers-reduced-motion:
 * no-preference` in globals.css, so reduced-motion users see a static
 * row.
 *
 * Decorative only — `aria-hidden` keeps it out of the a11y tree, and
 * the marquee is rendered inside the root layout so every page picks
 * it up without per-page wiring.
 */
export function VeryMarquee() {
  const tokens = Array.from({ length: 8 })
  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-border bg-bg-base py-6 md:py-10"
    >
      <div className="very-marquee-track flex w-max items-center gap-10 md:gap-16">
        {[...tokens, ...tokens].map((_, i) => (
          <span
            key={i}
            translate="no"
            className="block font-display text-[clamp(2.5rem,_8vw,_6rem)] font-bold leading-none tracking-tight text-fg-primary"
          >
            VERY
          </span>
        ))}
      </div>
    </div>
  )
}
