import { GlowBackground } from '@/components/ui/glow-background'
import { MANIFESTO } from '@/lib/content/manifesto'

function HomeHero() {
  return (
    <section className="relative flex h-[100dvh] items-center justify-center overflow-hidden px-6">
      <GlowBackground />
      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="font-mono text-xs uppercase tracking-[0.4em] text-[var(--color-accent-2)]">
          {MANIFESTO.heroEyebrow}
        </span>
        <h1 className="mt-6 font-display text-[clamp(3rem,12vw,10rem)] font-bold italic leading-[0.9] tracking-tight">
          VERY
        </h1>
        <p className="mt-6 max-w-xl text-balance text-[var(--color-fg-subtle)]">
          {MANIFESTO.heroSub}
        </p>
      </div>
      <ScrollHint />
    </section>
  )
}

function ScrollHint() {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-widest text-[var(--color-fg-muted)]">
      ↓ Scroll
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
