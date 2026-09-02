import Image from 'next/image'
import Link from 'next/link'
import { MANIFESTO } from '@/lib/content/manifesto'
import { STATS } from '@/lib/content/site'
import { getSiteConfig } from '@/lib/data/site-config'
import {
  formatDeadlineKst,
  getCurrentRecruitRound,
  isDeadlinePassed,
} from '@/lib/recruit/queries'
import { PhotoBand } from '@/components/site/photo-band'

/**
 * Home Hero - Editorial Cinematic.
 *
 * Full-bleed 100dvh page-as-poster. Four monospace corner labels frame an
 * asymmetric typographic field. A pair of cobalt 1px verticals (cropped to
 * the middle half of the viewport, with short horizontal end-ticks) act as
 * a film-print perforation. The VERY mark sits over a vertical cobalt glow.
 * Above the mark, a short 1px horizontal rule introduces an italic slogan
 * (Geist italic, lowercase, wide tracking) - masthead-style.
 *
 * All motion is CSS-only (see globals.css), so this stays a server component.
 */
async function HomeHero() {
  const siteConfig = await getSiteConfig()
  const semesterDigit = siteConfig.semester === '1학기' ? '1' : '2'
  // 마스트헤드는 볼륨 표기 하나만 남긴다. 사방 코너 라벨과 스크롤 큐는
  // 장식 과잉이라 제거 (리디자인 2026-08).
  const cornerLabels: ReadonlyArray<{
    slot: CornerSlot
    text: string
    accent: boolean
    delayMs: number
  }> = [
    { slot: 'tl', text: `VOL.${siteConfig.cohort} / ${siteConfig.year}-${semesterDigit}`, accent: true, delayMs: 0 },
  ]
  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden">
      <h1 className="sr-only" translate="no">
        VERY <span translate="yes">· 연세대학교 창업학회</span>
      </h1>

      <HeroGlow />
      <HeroFrame />
      <HeroCorners labels={cornerLabels} />
      <HeroCenterStack />
    </section>
  )
}

function HeroGlow() {
  // Two stacked vertical ellipses behind the mark. Cobalt, soft.
  // The inner one is sharper; the outer one is bigger and blurred for halo.
  return (
    <div aria-hidden className="hero-anim-glow pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute left-1/2 top-1/2 h-[80vh] w-[55vw] -translate-x-1/2 -translate-y-1/2 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, var(--color-accent) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[90vh] w-[75vw] -translate-x-1/2 -translate-y-1/2 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse at center, var(--color-accent-2) 0%, transparent 60%)',
          filter: 'blur(100px)',
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
      <div className="hero-anim-vline h-full w-px origin-center bg-fg-primary/30" />
      <span
        aria-hidden
        className={`hero-anim-tick absolute top-0 ${tickAlign} h-px w-2 origin-center bg-fg-primary/30`}
      />
      <span
        aria-hidden
        className={`hero-anim-tick absolute bottom-0 ${tickAlign} h-px w-2 origin-center bg-fg-primary/30`}
      />
    </div>
  )
}

type CornerSlot = 'tl' | 'tr' | 'bl' | 'br'

function HeroCorners({ labels }: { labels: ReadonlyArray<{ slot: CornerSlot; text: string; accent: boolean; delayMs: number }> }) {
  return (
    <>
      {labels.map((label) => (
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
    tl: 'top-[max(4.5rem,calc(env(safe-area-inset-top)+3rem))] left-[max(1.5rem,env(safe-area-inset-left))] md:top-24 md:left-10',
    tr: 'top-[max(4.5rem,calc(env(safe-area-inset-top)+3rem))] right-[max(1.5rem,env(safe-area-inset-right))] md:top-24 md:right-10 text-right',
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
          className="hero-anim-hline block h-px w-16 origin-center bg-fg-primary"
        />
        <p
          translate="no"
          className="hero-anim-heading font-display text-xs font-bold uppercase tracking-[0.42em] text-fg-primary md:text-sm"
        >
          Fail Forward
        </p>
        <p
          translate="no"
          className="hero-anim-slogan font-display text-sm italic lowercase tracking-[0.18em] text-fg-subtle md:text-base"
        >
          be ready to fail forward.
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
 * Manifesto - Asymmetric Editorial Grid.
 *
 * Magazine first-spread to Hero's cover. 12-col grid: a hangul mega headline
 * sits top-left; two labelled body blocks (WHO WE ARE / OUR VISION) drop into
 * the bottom-right, separated from the headline by a 1px cobalt vertical at
 * the col-7 boundary - reusing Hero's verticals motif. Mobile collapses to a
 * single stack with a horizontal rule standing in for the vertical.
 *
 * Stagger reveal is CSS-only (manifesto-* keyframes in globals.css). The
 * @supports (animation-timeline) layer upgrades the reveal to scroll-driven
 * for browsers that support it; otherwise it plays once on load (Hero is only
 * one scroll away, so the difference is small).
 */
function ManifestoSection() {
  const {
    heroHeadline,
    heroHeadline2,
    heroSubline,
    heroSub,
    heroSupport,
    whoWeAre,
    vision,
  } = MANIFESTO
  // Headline is laid out as two lines so the slogan reads with a cinematic
  // pause between "준비가" and "되어 있을 것." Final line takes the accent.
  return (
    <section
      id="manifesto"
      className="manifesto-section relative grid min-h-dvh grid-cols-12 gap-x-8 px-6 py-32 md:gap-x-12 md:px-10 md:py-40"
    >
      <ManifestoVertical />

      <header className="manifesto-anim-headline-block col-span-12 row-start-1 md:col-span-7">
        <h2 className="manifesto-anim-headline font-display font-bold tracking-tight text-fg-primary">
          <span className="block text-[clamp(2.5rem,_7.5vw,_6.5rem)] leading-[1.05]">
            {heroHeadline}
          </span>
          <span className="block text-[clamp(2.5rem,_7.5vw,_6.5rem)] leading-[1.05] text-accent-text">
            {heroHeadline2}
          </span>
        </h2>
        <p
          translate="no"
          className="manifesto-anim-subline mt-6 font-display text-xs font-bold uppercase tracking-[0.32em] text-fg-subtle md:mt-8 md:text-sm"
        >
          {heroSubline}
        </p>
        <p className="manifesto-anim-subline mt-3 max-w-[42ch] text-base leading-[1.7] text-fg-subtle md:text-lg">
          {heroSub}
        </p>
        <p
          translate="no"
          className="manifesto-anim-subline mt-6 font-display text-sm italic text-fg-muted md:mt-8"
        >
          {heroSupport}
        </p>
      </header>

      <hr
        aria-hidden
        className="manifesto-anim-hrule col-span-12 row-start-2 mt-12 h-px border-0 bg-border-strong md:hidden"
      />

      <div className="col-span-12 row-start-3 mt-10 flex flex-col gap-12 md:col-start-8 md:col-span-5 md:row-start-1 md:mt-0 md:gap-14 md:self-end">
        <ManifestoBlock body={whoWeAre} variant="who" />
        <ManifestoBlock body={vision} variant="vision" />
      </div>
    </section>
  )
}

function ManifestoVertical() {
  // 1px cobalt rule sitting at the col-7 boundary, desktop only. Cropped to
  // the section's inner padding so it reads as a magazine column guide rather
  // than reaching edge-to-edge.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-24 left-0 right-0 hidden md:block"
    >
      <div className="mx-auto grid h-full max-w-full grid-cols-12 gap-x-12 px-10">
        <div className="col-start-7 -ml-6 h-full w-px">
          <div className="manifesto-anim-vline h-full w-px origin-top bg-fg-primary/25" />
        </div>
      </div>
    </div>
  )
}

function ManifestoBlock({
  body,
  variant,
}: {
  body: string
  variant: 'who' | 'vision'
}) {
  // 라벨 없이 본문만. 문단 첫머리가 곧 소제목 역할을 한다.
  const bodyAnim =
    variant === 'who' ? 'manifesto-anim-body-1' : 'manifesto-anim-body-2'
  return (
    <p
      className={`${bodyAnim} max-w-[42ch] border-l border-border-strong pl-5 text-base leading-[1.8] text-fg-subtle md:pl-6 md:text-lg`}
    >
      {body}
    </p>
  )
}

/**
 * Stats - status screen.
 *
 * Four-cell band styled as a terminal status readout (per VERY BI):
 * mono prompt prefix `$ stats --vol=N` for the eyebrow, `[OK]` markers
 * above each cell value, and a short `--` divider between label and
 * caption. The big display numerals stay editorial; the mono chrome
 * around them lands the status-screen visual code from the BI doc.
 *
 * Mobile: 2x2 grid. Desktop: single row of four. Stagger animation
 * preserved from the prior version so motion design across hero →
 * manifesto → stats stays continuous.
 *
 * Numbers source from `lib/content/site.ts`. ALUMNI and STARTUPS counts
 * are placeholders (society has not finalized the exact figures yet) -
 * the `+` sign signals "at least this many" so the copy reads honestly
 * until the authoritative numbers land.
 */
async function StatsSection() {
  const siteConfig = await getSiteConfig()
  const yearsActive = siteConfig.year - siteConfig.sinceYear
  const cells: ReadonlyArray<{
    value: string
    label: string
    caption: string
  }> = [
    {
      value: String(yearsActive),
      label: '년의 활동',
      caption: '벤처창업연구회로 시작한 시간',
    },
    {
      value: String(siteConfig.cohort),
      label: '번째 기수',
      caption: '학기마다 다진 한 묶음의 지반',
    },
    {
      value: `${STATS.alumniCount}+`,
      label: '명의 알럼나이',
      caption: '누적 회원 네트워크',
    },
    {
      value: `${STATS.startupsCount}+`,
      label: '개의 창업팀',
      caption: '학회를 거쳐간 팀들',
    },
  ]

  return (
    <section
      id="stats"
      aria-labelledby="stats-heading"
      className="stats-section relative px-6 py-32 md:px-10 md:py-40"
    >
      <h2
        id="stats-heading"
        className="stats-anim-eyebrow font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl"
      >
        {siteConfig.sinceYear}년부터 멈춘 적 없이 이어져 왔습니다
      </h2>

      <hr
        aria-hidden
        className="stats-anim-hrule mt-10 h-px border-0 bg-border-strong md:mt-12"
      />

      <ul className="stats-grid mt-12 grid grid-cols-2 gap-x-8 gap-y-14 md:mt-16 md:grid-cols-4 md:gap-x-12">
        {cells.map((cell, index) => (
          <StatCell
            key={cell.label}
            value={cell.value}
            label={cell.label}
            caption={cell.caption}
            index={index}
          />
        ))}
      </ul>
    </section>
  )
}

function StatCell({
  value,
  label,
  caption,
  index,
}: {
  value: string
  label: string
  caption: string
  index: number
}) {
  return (
    <li
      className="stats-anim-cell relative flex flex-col gap-3"
      style={{ animationDelay: `${300 + index * 120}ms` }}
    >
      <span
        translate="no"
        className="whitespace-nowrap font-display text-[clamp(3.5rem,_10vw,_8rem)] font-bold leading-[0.95] tracking-tight text-fg-primary"
      >
        {value}
      </span>
      <span className="font-display text-base font-bold text-fg-primary">
        {label}
      </span>
      <span className="font-display text-sm leading-[1.6] text-fg-subtle md:text-base">
        {caption}
      </span>
    </li>
  )
}

/**
 * 시즌 연동 모집 CTA. 접수가 열려 있을 때만 홈 맨 아래에 뜬다.
 *
 * 홈 본문에 지원 경로가 하나도 없어 네비게이션 메뉴를 열어야만 모집을 찾을
 * 수 있었다. 상시 배너 대신 시즌 상태 기계(apply_open + 마감 시각)에 연동해,
 * 모집 중이 아닐 때는 홈이 브랜드 포스터로 돌아간다.
 *
 * 홈은 ISR(5분)이라 시즌 열림·마감 전환이 화면에 최대 5분 늦게 반영된다.
 * 접수 차단 자체는 /recruit의 서버 판정이 실시간으로 하므로 무해하다.
 */
async function RecruitCtaSection() {
  const round = await getCurrentRecruitRound()
  if (!round?.apply_open || isDeadlinePassed(round)) return null
  const deadline = formatDeadlineKst(round)
  return (
    <section className="relative border-t border-border px-6 py-24 md:px-10 md:py-32">
      <p
        translate="no"
        className="flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-accent-text md:text-xs"
      >
        <span aria-hidden className="mr-3 inline-block h-px w-8 bg-accent" />
        RECRUIT · VOL.{round.cohort} OPEN
      </p>
      <h2 className="mt-6 font-display text-[clamp(1.75rem,_4.5vw,_3rem)] font-bold leading-tight tracking-tight text-fg-primary">
        {round.cohort}기 학회원을 모집합니다.
      </h2>
      {deadline && (
        <p className="mt-4 font-display text-sm text-fg-subtle md:text-base">
          서류 접수 마감 {deadline}
        </p>
      )}
      <div className="mt-8">
        <Link
          href="/recruit"
          className="inline-flex items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
        >
          지원하기
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

export default async function HomePage() {
  return (
    <main>
      <HomeHero />
      <ManifestoSection />
      <PhotoBand />
      <StatsSection />
      <RecruitCtaSection />
    </main>
  )
}
