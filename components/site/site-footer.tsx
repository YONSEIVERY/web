import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import veryMark from '@/public/brand/very-mark.png'
import { NAV_ITEMS } from '@/lib/content/nav'
import { SITE } from '@/lib/content/site'

/**
 * Site Footer — magazine colophon.
 *
 * Three labeled columns under a wordmark + slogan masthead, separated from
 * the body by the same 1px hairline motif that runs through hero and
 * manifesto. Bottom row is a colophon strip: copyright on the left, Volume
 * number on the right, mono caps throughout.
 *
 * Pure RSC, content sourced from `lib/content/site.ts` and `nav.ts` so
 * there's a single edit point for IA + contact info.
 */
export function SiteFooter() {
  const startYear = SITE.since
  const endYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-border bg-bg-base px-6 pb-10 pt-20 md:px-10 md:pb-12 md:pt-28">
      <div className="grid grid-cols-12 gap-x-8 gap-y-12 md:gap-x-12">
        <div className="col-span-12 md:col-span-4">
          <Link href="/" aria-label="VERY 홈" className="inline-block">
            <Image
              src={veryMark}
              alt="VERY"
              priority={false}
              className="h-10 w-auto md:h-12"
            />
          </Link>
          <p className="mt-5 max-w-[28ch] font-display text-sm italic lowercase tracking-[0.18em] text-fg-subtle md:text-base">
            be ready to fail forward.
          </p>
          <p
            translate="no"
            className="mt-6 font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
          >
            VOL.{SITE.currentCohort} / {endYear}—1 · EST. {SITE.since}
          </p>
        </div>

        <FooterColumn label="EXPLORE" mdSpan="md:col-span-2">
          <ul className="flex flex-col gap-2.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href as Route}
                  translate="no"
                  className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-subtle transition-colors hover:text-fg-primary"
                >
                  {item.monoLabel}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn label="CONTACT" mdSpan="md:col-span-3">
          <ul className="flex flex-col gap-2.5">
            <li>
              <a
                href={`mailto:${SITE.email}`}
                translate="no"
                className="break-all font-mono text-[11px] uppercase tracking-[0.28em] text-fg-subtle transition-colors hover:text-fg-primary"
              >
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                translate="no"
                className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-subtle transition-colors hover:text-fg-primary"
              >
                @VERY_YONSEI
              </a>
            </li>
          </ul>
        </FooterColumn>

        <FooterColumn label="VISIT" mdSpan="md:col-span-3">
          <address className="not-italic">
            <p className="font-display text-sm leading-[1.8] text-fg-subtle">
              연세대학교 신촌캠퍼스
              <br />
              제1공학관 A119호
            </p>
            <p
              translate="no"
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
            >
              SEOUL, KR
            </p>
          </address>
        </FooterColumn>
      </div>

      <hr aria-hidden className="mt-16 h-px border-0 bg-border md:mt-20" />

      <div className="mt-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <p
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
        >
          © {startYear}—{endYear} VERY · All rights reserved
        </p>
        <p
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
        >
          YONSEI UNIVERSITY · ENTREPRENEURSHIP SOCIETY
        </p>
      </div>
    </footer>
  )
}

function FooterColumn({
  label,
  mdSpan,
  children,
}: {
  label: string
  mdSpan: `md:col-span-${number}`
  children: React.ReactNode
}) {
  return (
    <div className={`col-span-6 min-w-0 ${mdSpan}`}>
      <p
        translate="no"
        className="flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
      >
        <span aria-hidden className="mr-3 inline-block h-px w-6 bg-fg-primary" />
        {label}
      </p>
      <div className="mt-5">{children}</div>
    </div>
  )
}
