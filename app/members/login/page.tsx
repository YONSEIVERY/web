import type { Metadata } from 'next'
import { SignInButton } from './signin-button'

export const metadata: Metadata = {
  title: '학회원 로그인',
  robots: 'noindex',
}

export default async function MembersLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-sm border border-border p-10">
        <p
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
        >
          VERY · MEMBERS
        </p>
        <h1 className="mt-4 font-display text-2xl text-fg-primary">
          학회원 포털
        </h1>
        {error === 'not_member' && (
          <div className="mt-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-red-400">
              ▲ 학회원 명단에 없는 계정입니다.
            </p>
            {/* 여기서 막힌 사람의 다음 걸음이 등록 신청이다. 절대 URL을 쓴다.
                members 호스트에서 상대경로 /join은 미들웨어가 포털 경로로
                리라이트해 마케팅의 신청 폼에 닿지 못한다. */}
            <p className="mt-2 font-display text-xs leading-relaxed text-fg-subtle">
              44기 신규 학회원이라면{' '}
              <a
                href="https://yonseivery.com/join"
                className="text-fg-primary underline"
              >
                등록 신청
              </a>
              을 먼저 해주세요. 방금 신청하셨다면 운영진 승인을 기다려주세요.
            </p>
          </div>
        )}
        {error === 'oauth_failed' && (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-red-400">
            ▲ 로그인에 실패했습니다. 다시 시도해주세요.
          </p>
        )}
        <div className="mt-8">
          <SignInButton />
        </div>
        <p className="mt-6 font-display text-xs leading-relaxed text-fg-muted">
          학회원 명단에 등록된 이메일로만 접근할 수 있습니다. 등록 이메일이
          기억나지 않으면 임원진에게 문의해주세요.
        </p>
      </div>
    </main>
  )
}
