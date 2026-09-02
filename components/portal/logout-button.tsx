'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

/**
 * 포털 로그아웃. 이게 없으면 공용 노트북이나 잘못 고른 구글 계정으로 들어온
 * 사람이 스스로 빠져나갈 길이 없다.
 *
 * 이동은 router.push가 아니라 전체 내비게이션으로 한다. staleTimes로 켠
 * 클라이언트 라우터 캐시에 로그인 상태의 화면이 30초간 남아 있어서, 소프트
 * 내비게이션이면 로그아웃 직후 뒤로 가기로 캐시된 포털 화면이 열린다.
 * 하드 로드는 그 캐시를 통째로 비운다.
 */
export function LogoutButton({ email }: { email: string }) {
  const [pending, setPending] = useState(false)

  const onLogout = async () => {
    if (pending) return
    setPending(true)
    try {
      await createClient().auth.signOut()
    } catch (err) {
      // 실패해도 로그인 화면으로 보낸다. 미들웨어가 세션 없는 접근을 다시
      // 막아 주므로 이쪽이 잠긴 화면에 갇히는 것보다 낫다.
      console.error('[portal] signOut failed', err)
    }
    window.location.assign('/members/login')
  }

  return (
    <div className="mt-auto border-t border-border pt-4">
      <p
        translate="no"
        className="break-all font-mono text-[10px] text-fg-muted"
        title={email}
      >
        {email}
      </p>
      <button
        type="button"
        onClick={onLogout}
        disabled={pending}
        className="mt-2 flex min-h-11 w-full items-center border-l-2 border-transparent pl-3 pr-2 font-mono text-xs uppercase tracking-[0.28em] text-fg-subtle transition-colors hover:text-fg-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? '로그아웃 중…' : '로그아웃'}
      </button>
    </div>
  )
}
