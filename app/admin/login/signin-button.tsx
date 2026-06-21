'use client'
import { createClient } from '@/lib/supabase/browser'

export function SignInButton() {
  return (
    <button
      onClick={async () => {
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${location.origin}/admin/auth/callback`,
            queryParams: { prompt: 'select_account' },
          },
        })
      }}
      className="w-full font-mono text-xs uppercase tracking-[0.28em] border border-fg-primary px-6 py-3 hover:bg-fg-primary hover:text-bg-base transition-colors"
    >
      Google로 로그인
    </button>
  )
}
