'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { saveMyIntro } from '@/app/members/actions/intro'
import {
  INTRO_INITIAL_STATE,
  type IntroFormState,
} from '@/app/members/actions/intro-state'

/**
 * 자기소개 편집 폼. 저장해도 입력값이 그대로 남는 편집기형 UX라
 * 성공 시 화면 전환 없이 상태 문구만 보여준다.
 */
export function IntroForm({ defaultValue }: { defaultValue: string }) {
  const [state, action] = useActionState<IntroFormState, FormData>(
    saveMyIntro,
    INTRO_INITIAL_STATE,
  )

  return (
    <form action={action} className="grid grid-cols-1 gap-4">
      <textarea
        name="body_md"
        rows={8}
        maxLength={8000}
        defaultValue={defaultValue}
        placeholder={PLACEHOLDER}
        className="min-h-[40dvh] w-full border border-border bg-bg-base px-4 py-3 font-display text-base leading-[1.8] text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:min-h-[28rem] md:text-sm"
      />
      <p className="font-display text-xs leading-relaxed text-fg-muted">
        마크다운을 지원합니다. # 제목, - 목록, **굵게**, [링크](주소) 형식을
        쓸 수 있고, 저장하면 멤버 페이지에 바로 반영됩니다.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        {state.status === 'success' && (
          <p
            role="status"
            className="font-display text-sm text-fg-primary"
          >
            저장되었습니다.
          </p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}

const PLACEHOLDER = `# 안녕하세요, OOO입니다
관심 분야, 하고 있는 일, VERY에서 해보고 싶은 것을 자유롭게 적어주세요.

- 관심:
- 요즘 하는 것:
- 같이 하고 싶은 것: `

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      translate="no"
      className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60 md:text-xs"
    >
      {pending ? '저장 중…' : '저장하기'}
      <span aria-hidden>→</span>
    </button>
  )
}
