import Link from 'next/link'
import type { Route } from 'next'
import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import { getMemberProfile } from '@/lib/portal/queries'
import { IntroForm } from '@/components/portal/intro-form'

export const dynamic = 'force-dynamic'

/** 내 소개 편집. 로그인 이메일과 매칭되는 본인 행만 다룬다. */
export default async function MyProfilePage() {
  const identity = await getPortalIdentity()
  const member = identity ? await getMemberByEmail(identity.email) : null

  if (!member) {
    return (
      <div>
        <Header />
        <p className="mt-10 max-w-[52ch] font-display text-sm leading-relaxed text-fg-subtle">
          로그인 계정과 매칭되는 학회원 정보를 찾지 못했습니다. 학회원 명단에
          등록된 이메일과 로그인 이메일이 다른 경우이니, 임원진에게
          문의해주세요.
        </p>
      </div>
    )
  }

  const profile = await getMemberProfile(member.id)

  return (
    <div>
      <Header />
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {member.name}님의 소개
      </h1>
      <p className="mt-3 max-w-[56ch] font-display text-sm leading-relaxed text-fg-subtle">
        Vol.{member.cohort} 멤버 페이지에 올라가는 자기소개입니다. 편하게
        쓰고, 언제든 다시 고치면 됩니다.
        {' '}
        <Link
          href={`/members/people/${member.id}` as Route}
          className="underline hover:text-fg-primary"
        >
          내 페이지 미리 보기
        </Link>
      </p>

      <div className="mt-8 max-w-2xl">
        <IntroForm defaultValue={profile?.intro_md ?? ''} />
      </div>
    </div>
  )
}

function Header() {
  return (
    <p
      translate="no"
      className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
    >
      MEMBERS · MY INTRO
    </p>
  )
}
