import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublicMembersByCohort,
  type PublicMember,
} from '@/lib/cohort-members/queries'

export const revalidate = 60

const MAX_COHORT = 100

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cohort: string }>
}): Promise<Metadata> {
  const { cohort } = await params
  const n = Number.parseInt(cohort, 10)
  if (!Number.isInteger(n) || n < 1 || n > MAX_COHORT) return {}
  return {
    title: `${n}기 학회원`,
    description: `연세대학교 창업학회 VERY ${n}기 학회원 프로필. 회장단·임원진·학회원.`,
  }
}

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ cohort: string }>
}) {
  const { cohort } = await params
  const n = Number.parseInt(cohort, 10)
  if (!Number.isInteger(n) || n < 1 || n > MAX_COHORT) notFound()
  const members = await getPublicMembersByCohort(n)
  if (members.length === 0) notFound()

  const leadership = members.filter(
    (m) => m.role_tier === 'president' || m.role_tier === 'vice_president',
  )
  const officers = members.filter((m) => m.role_tier === 'officer')
  const regulars = members.filter((m) => m.role_tier === 'member')

  return (
    <main className="pt-14 md:pt-16">
      <section className="about-hero relative px-6 pb-16 pt-24 md:px-10 md:pb-24 md:pt-32">
        <p
          translate="no"
          className="about-anim-eyebrow flex items-center font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs"
        >
          <span aria-hidden className="mr-3 inline-block h-px w-8 bg-fg-muted" />
          Members — Vol.{n}
        </p>
        <h1 className="about-anim-headline mt-8 font-display font-bold tracking-tight text-fg-primary md:mt-10">
          <span className="block text-[clamp(2.5rem,_7.5vw,_6.5rem)] leading-[1.05]">
            {n}기 학회원.
          </span>
        </h1>
        <p
          translate="no"
          className="about-anim-subline mt-8 max-w-[58ch] font-display text-sm italic lowercase tracking-[0.12em] text-fg-subtle md:mt-10 md:text-base"
        >
          이번 학기 지반을 함께 다지는 사람들.
        </p>
      </section>

      {leadership.length > 0 && (
        <MemberGroup
          eyebrow="LEADERSHIP"
          title="회장단"
          members={leadership}
          size="lg"
        />
      )}

      {officers.length > 0 && (
        <MemberGroup
          eyebrow="OFFICERS"
          title="임원진"
          members={officers}
          size="md"
        />
      )}

      {regulars.length > 0 && (
        <MemberGroup
          eyebrow="MEMBERS"
          title="학회원"
          members={regulars}
          size="sm"
        />
      )}

      <section className="px-6 pb-32 md:px-10 md:pb-40">
        <div className="mx-auto max-w-4xl border-t border-border pt-10">
          <Link
            href={'/cohorts' as Route}
            translate="no"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted transition-colors hover:text-fg-primary md:text-xs"
          >
            <span aria-hidden>←</span>
            기수 아카이브
          </Link>
        </div>
      </section>
    </main>
  )
}

function MemberGroup({
  eyebrow,
  title,
  members,
  size,
}: {
  eyebrow: string
  title: string
  members: PublicMember[]
  size: 'lg' | 'md' | 'sm'
}) {
  const gridCols =
    size === 'lg'
      ? 'grid-cols-1 sm:grid-cols-2'
      : size === 'md'
        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
  return (
    <section className="about-section relative grid grid-cols-12 gap-x-8 px-6 py-16 md:gap-x-12 md:px-10 md:py-24">
      <SectionLabel label={eyebrow} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-9 md:mt-0">
        <h2 className="about-anim-title font-display text-[clamp(1.5rem,_3vw,_2.25rem)] font-bold leading-[1.15] tracking-tight text-fg-primary">
          {title}
        </h2>
        <ul className={`about-anim-meta mt-10 grid gap-6 md:mt-12 md:gap-8 ${gridCols}`}>
          {members.map((m) => (
            <MemberCard key={m.id} member={m} size={size} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function MemberCard({
  member,
  size,
}: {
  member: PublicMember
  size: 'lg' | 'md' | 'sm'
}) {
  return (
    <li className="flex flex-col gap-3">
      <PhotoFrame member={member} size={size} />
      <div className="flex flex-col gap-1">
        <p
          className={`font-display font-bold tracking-tight text-fg-primary ${
            size === 'lg'
              ? 'text-2xl md:text-3xl'
              : size === 'md'
                ? 'text-lg md:text-xl'
                : 'text-base'
          }`}
        >
          {member.name}
        </p>
        {member.role_label && (
          <p
            translate="no"
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted md:text-xs"
          >
            {member.role_label}
          </p>
        )}
        {(member.college || member.major) && (
          <p className="text-xs text-fg-subtle md:text-sm">
            {member.college}
            {member.college && member.major ? ' · ' : ''}
            {member.major}
          </p>
        )}
        {member.bio && (
          <p className="mt-1 text-xs leading-[1.6] text-fg-subtle md:text-sm">
            {member.bio}
          </p>
        )}
      </div>
    </li>
  )
}

function PhotoFrame({
  member,
  size,
}: {
  member: PublicMember
  size: 'lg' | 'md' | 'sm'
}) {
  const sizeClass = 'aspect-[2/3] w-full'
  const container = `relative overflow-hidden border border-border bg-bg-elev ${sizeClass}`
  if (member.photo_url) {
    return (
      <div className={container}>
        <Image
          src={member.photo_url}
          alt={member.name}
          fill
          sizes={
            size === 'lg'
              ? '(min-width: 640px) 40vw, 90vw'
              : size === 'md'
                ? '(min-width: 768px) 20vw, 45vw'
                : '(min-width: 1024px) 18vw, 40vw'
          }
          className="object-cover"
        />
      </div>
    )
  }
  const initial = member.name.slice(0, 1)
  return (
    <div
      className={`${container} flex items-center justify-center`}
      aria-hidden
    >
      <span
        translate="no"
        className="font-display text-4xl font-bold text-fg-muted md:text-6xl"
      >
        {initial}
      </span>
    </div>
  )
}

function SectionLabel({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <p
      translate="no"
      className={`about-anim-eyebrow flex items-start font-mono text-[10px] uppercase tracking-[0.4em] text-fg-muted md:text-xs ${className ?? ''}`}
    >
      <span
        aria-hidden
        className="mr-3 mt-2 inline-block h-px w-6 bg-fg-muted md:w-8"
      />
      {label}
    </p>
  )
}
