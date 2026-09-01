import type { Metadata } from 'next'
import { getSiteConfig } from '@/lib/data/site-config'
import { MemberSignupForm } from '@/components/forms/member-signup-form'

/**
 * 학회원 자율 등록 (/join).
 *
 * 합격자 일괄 등록으로 명단에 오른 사람은 여기 올 일이 없다. 지원서에 적은
 * 이메일과 실제 구글 로그인 계정이 다른 사람이 본인 로그인 주소를 신고하는
 * 자리다. 링크는 단톡방으로만 돌리므로 검색 노출은 막는다.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '학회원 등록 신청',
  description:
    '연세대학교 창업학회 VERY 학회원 포털 등록 신청. 승인 후 포털에 입장할 수 있습니다.',
  robots: 'noindex',
}

export default async function JoinPage() {
  const { cohort } = await getSiteConfig()

  return (
    <main className="px-6 pt-14 md:px-10 md:pt-16">
      <div className="mx-auto max-w-2xl py-24 md:py-32">
        <p
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
        >
          MEMBER · SIGNUP
        </p>
        <h1 className="mt-4 font-display text-4xl text-fg-primary md:text-5xl">
          학회원 등록 신청
        </h1>
        <p className="mt-4 font-display text-base leading-[1.8] text-fg-subtle">
          <span translate="no">{cohort}기</span> 학회원 포털에 등록하기 위한
          신청서입니다. 합격 안내를 받으신 분만 작성해주세요.
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-4 border border-border-strong px-5 py-5">
          <Point label="01">
            여기 적는 이메일이 그대로 포털 로그인 계정이 됩니다.{' '}
            <strong className="font-semibold text-fg-primary">
              구글 로그인이 되는 주소
            </strong>
            를 적어주세요. 지원서에 쓴 주소와 달라도 괜찮습니다.
          </Point>
          <Point label="02">
            운영진 승인 후에 포털에 입장할 수 있습니다. 신청 즉시 열리지
            않습니다.
          </Point>
          <Point label="03">
            수집 항목은 이름, 이메일, 연락처와 학번·단과대·전공(선택)입니다.
            학회원 포털 계정 등록과 학회 운영에만 사용합니다.
          </Point>
        </ul>

        <div className="mt-12">
          <MemberSignupForm cohort={cohort} />
        </div>
      </div>
    </main>
  )
}

function Point({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <span
        translate="no"
        aria-hidden
        className="mt-1 shrink-0 font-mono text-[10px] tracking-[0.32em] text-fg-muted"
      >
        {label}
      </span>
      <span className="font-display text-sm leading-[1.8] text-fg-subtle">
        {children}
      </span>
    </li>
  )
}
