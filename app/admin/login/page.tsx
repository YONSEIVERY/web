import type { Metadata } from 'next'
import { SignInButton } from './signin-button'

export const metadata: Metadata = {
  title: 'VERY · Admin Login',
  robots: 'noindex',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm border border-border p-10">
        <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs">
          VERY · ADMIN
        </p>
        <h1 className="mt-4 font-display text-2xl text-fg-primary">로그인</h1>
        {error === 'unauthorized' && (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-red-600">
            ▲ 화이트리스트에 등록되지 않은 계정입니다.
          </p>
        )}
        <div className="mt-8">
          <SignInButton />
        </div>
        <p className="mt-6 font-display text-xs text-fg-muted">
          임원진 화이트리스트에 등록된 이메일만 접근 가능합니다.
        </p>
      </div>
    </main>
  )
}
