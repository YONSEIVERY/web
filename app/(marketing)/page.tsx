import Image from 'next/image'
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
        <h1 className="sr-only">VERY</h1>
        <Image
          src="/brand/very-wordmark.png"
          alt="VERY"
          width={1080}
          height={1080}
          priority
          className="mt-4 h-auto w-[clamp(18rem,58vw,40rem)]"
        />
        <p className="-mt-6 font-display text-base italic tracking-wide text-[var(--color-fg-subtle)] sm:text-lg">
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
