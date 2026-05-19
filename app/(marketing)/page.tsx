import Image from 'next/image'

/**
 * Home Hero — Editorial Cinematic.
 *
 * Full-bleed 100dvh page-as-poster. Four monospace corner labels frame an
 * asymmetric typographic field. A pair of cobalt 1px verticals (cropped to
 * the middle half of the viewport, with short horizontal end-ticks) act as
 * a film-print perforation. The VERY mark sits over a vertical cobalt glow.
 * Above the mark, a short 1px horizontal rule introduces an italic slogan
 * (Geist italic, lowercase, wide tracking) — masthead-style.
 *
 * All motion is CSS-only (see globals.css), so this stays a server component.
 */
function HomeHero() {
  return (
    <section className="relative h-[100dvh] w-full overflow-hidden">
      <h1 className="sr-only" translate="no">
        VERY <span translate="yes">— 연세대학교 창업학회</span>
      </h1>

      <HeroGlow />
      <HeroFrame />
      <HeroCorners />
      <HeroCenterStack />
      <HeroScrollHint />
    </section>
  )
}

function HeroGlow() {
  // Two stacked vertical ellipses behind the mark. Cobalt, soft.
  // The inner one is sharper; the outer one is bigger and blurred for halo.
  return (
    <div aria-hidden className="hero-anim-glow pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute left-1/2 top-1/2 h-[80vh] w-[55vw] -translate-x-1/2 -translate-y-1/2 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at center, var(--color-accent) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[90vh] w-[75vw] -translate-x-1/2 -translate-y-1/2 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, var(--color-accent-2) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  )
}

function HeroFrame() {
  // Two vertical 1px cobalt rules at the page edges, cropped to the middle
  // half of the viewport, with short horizontal end-ticks. Reads like a
  // cinema reel frame. transform-origin centers the scaleY animation.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <FrameVertical side="left" />
      <FrameVertical side="right" />
    </div>
  )
}

function FrameVertical({ side }: { side: 'left' | 'right' }) {
  const sidePos = side === 'left' ? 'left-6 md:left-10' : 'right-6 md:right-10'
  const tickAlign = side === 'left' ? 'left-0' : 'right-0'
  return (
    <div className={`absolute ${sidePos} top-1/4 bottom-1/4 w-px`}>
      <div className="hero-anim-vline h-full w-px origin-center bg-accent/60" />
      <span
        aria-hidden
        className={`hero-anim-tick absolute top-0 ${tickAlign} h-px w-2 origin-center bg-accent/60`}
      />
      <span
        aria-hidden
        className={`hero-anim-tick absolute bottom-0 ${tickAlign} h-px w-2 origin-center bg-accent/60`}
      />
    </div>
  )
}

type CornerSlot = 'tl' | 'tr' | 'bl' | 'br'

const CORNER_LABELS: ReadonlyArray<{
  slot: CornerSlot
  text: string
  accent: boolean
  delayMs: number
}> = [
  { slot: 'tl', text: 'VOL.43 / 2026—1', accent: true, delayMs: 0 },
  { slot: 'tr', text: 'EST. 1997', accent: false, delayMs: 100 },
  { slot: 'bl', text: 'YONSEI UNIVERSITY', accent: false, delayMs: 200 },
  { slot: 'br', text: 'SEOUL, KR', accent: false, delayMs: 300 },
]

function HeroCorners() {
  return (
    <>
      {CORNER_LABELS.map((label) => (
        <CornerLabel key={label.slot} {...label} />
      ))}
    </>
  )
}

function CornerLabel({
  slot,
  text,
  accent,
  delayMs,
}: {
  slot: CornerSlot
  text: string
  accent: boolean
  delayMs: number
}) {
  const pos = {
    tl: 'top-[max(1.5rem,env(safe-area-inset-top))] left-[max(1.5rem,env(safe-area-inset-left))] md:top-8 md:left-10',
    tr: 'top-[max(1.5rem,env(safe-area-inset-top))] right-[max(1.5rem,env(safe-area-inset-right))] md:top-8 md:right-10 text-right',
    bl: 'bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] md:bottom-8 md:left-10',
    br: 'bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] md:bottom-8 md:right-10 text-right',
  }[slot]
  const color = accent ? 'text-accent-2' : 'text-fg-muted'
  return (
    <span
      translate="no"
      className={`hero-anim-corner absolute ${pos} z-10 font-mono text-[10px] uppercase tracking-[0.32em] ${color} md:text-xs`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {text}
    </span>
  )
}

/**
 * Mark + masthead share one centered flex column so the typographic stack
 * moves together at every viewport. Masthead sits above the mark like an
 * editorial cover line; gap scales with viewport.
 */
function HeroCenterStack() {
  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-[clamp(1.25rem,_4vh,_2.5rem)] px-6">
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden
          className="hero-anim-hline block h-px w-16 origin-center bg-accent"
        />
        <p
          translate="no"
          className="hero-anim-slogan font-display text-sm italic lowercase tracking-[0.18em] text-fg-subtle md:text-base"
        >
          lander · settler · fail forward
        </p>
      </div>
      <Image
        src="/brand/very-mark.png"
        alt=""
        width={1080}
        height={608}
        preload
        sizes="(max-width: 768px) 90vw, 70vw"
        className="hero-anim-mark h-auto w-[clamp(20rem,_70vw,_56rem)]"
      />
    </div>
  )
}

/**
 * Wrapper pins the element to the bottom-center via translateX(-50%); the
 * inner span owns the animations so the wrapper's transform is never
 * clobbered by the keyframes' transform property.
 */
function HeroScrollHint() {
  return (
    <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 md:bottom-10">
      <span className="hero-anim-scroll block font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs">
        ↓ Scroll
      </span>
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      <HomeHero />
    </main>
  )
}
