'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { Route } from 'next'

/**
 * 어드민 공통 에러 경계. 포털의 (authed)/error.tsx와 같은 설계다.
 * (authed) 레이아웃 위쪽은 감싸지 않으므로 어드민 네비는 그대로 남는다.
 *
 * error.message는 화면에 쓰지 않는다. 프로덕션에서 서버 컴포넌트 전파
 * 오류는 식별자만 붙은 일반 문구가 된다. digest를 병기해 캡처 한 장으로
 * 서버 로그를 찾을 수 있게 한다.
 */
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[admin] route error', error)
  }, [error])

  return (
    <div className="max-w-2xl">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted md:text-xs"
      >
        ADMIN · ERROR
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg-primary md:text-3xl">
        화면을 불러오지 못했습니다.
      </h1>
      <p className="mt-4 max-w-[52ch] font-display text-sm leading-relaxed text-fg-subtle">
        일시적인 문제일 수 있습니다. 다시 시도해도 같은 화면이 나오면 아래
        코드와 함께 개발 담당에게 알려주세요.
      </p>
      {error.digest && (
        <p translate="no" className="mt-6 font-mono text-[10px] text-fg-muted">
          ERROR ID · {error.digest}
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base md:text-xs"
        >
          다시 시도
          <span aria-hidden>→</span>
        </button>
        <Link
          href={'/admin' as Route}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-subtle underline hover:text-fg-primary"
        >
          어드민 홈
        </Link>
      </div>
    </div>
  )
}
