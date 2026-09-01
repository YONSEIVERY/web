'use client'
import { useEffect, useRef, useState } from 'react'
import { submitMemberSignup } from '@/app/actions/member-signup'
import {
  MEMBER_SIGNUP_INITIAL_STATE,
  type MemberSignupState,
} from '@/app/actions/member-signup-state'
import { PrivacyConsent } from '@/components/forms/privacy-consent'

/**
 * 학회원 자율 등록 폼 (/join).
 *
 * `<form action={serverAction}>` 대신 onSubmit에서 서버 액션을 직접 부른다.
 * React 19는 form action으로 제출하면 액션 실행 직전에 폼을 자동 초기화한다
 * (react-dom의 startHostTransition이 requestFormReset을 호출). 그러면
 * "이미 신청하셨습니다" 같은 안내 한 번에 일곱 칸이 전부 날아간다.
 * 이 폼은 실패해도 입력이 남아 있어야 해서 초기화 경로를 타지 않는다.
 * 리크루팅 폼(recruit-application-form.tsx)이 같은 이유로 같은 구조다.
 *
 * 허니팟은 두지 않는다. 알럼나이 폼에서 브라우저 autofill이 숨은 칸을
 * 채워 정상 제출이 조용히 버려진 사례가 있었다. 여기서 같은 일이 나면
 * 본인은 신청했다고 믿는데 명단에 없어 OT 당일 포털에 못 들어간다.
 * 스팸 억제는 서버 액션의 이중 rate limit이 맡는다.
 */

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm'
const LABEL_CLASS =
  'flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs'

const CONSENT_TEXT =
  '학회원 포털 계정 등록과 학회 운영을 위해 이름, 이메일, 연락처와 학번·단과대·전공(선택)을 수집·이용하는 것에 동의합니다. 정보는 학회원 자격이 유지되는 동안 보유하며, 본인이 삭제를 요청하면 파기합니다. 동의를 거부할 권리가 있으며, 거부 시 등록 신청이 불가합니다.'

export function MemberSignupForm({ cohort }: { cohort: number }) {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<MemberSignupState>(
    MEMBER_SIGNUP_INITIAL_STATE,
  )
  const [localError, setLocalError] = useState<string | null>(null)

  if (result.status === 'success') return <Success />

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return
    const form = e.currentTarget
    // 이전 안내·오류를 먼저 지운다. 남아 있으면 새 결과와 겹쳐 보인다.
    setLocalError(null)
    setResult(MEMBER_SIGNUP_INITIAL_STATE)

    const value = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ??
      ''
    // 오타 방지가 이 폼의 핵심이라 왕복 전에 먼저 잡아준다. 서버도 같은
    // 검증을 다시 한다.
    if (value('email').toLowerCase() !== value('email_confirm').toLowerCase()) {
      setLocalError('두 이메일이 서로 다릅니다. 다시 확인해주세요.')
      return
    }

    setPending(true)
    try {
      setResult(await submitMemberSignup(new FormData(form)))
    } catch (err) {
      console.error('member signup submit failed', err)
      setResult({
        status: 'error',
        message: '신청에 실패했습니다. 잠시 후 다시 시도해주세요.',
      })
    } finally {
      setPending(false)
    }
  }

  const errorMessage =
    localError ?? (result.status === 'error' ? result.message : null)

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8">
      {/* 기수는 사용자가 고르지 않는다. 서버가 site_config에서 읽은 값을
          그대로 보여주고, 서버 액션도 hidden 값을 믿지 않고 다시 읽는다. */}
      <input type="hidden" name="cohort" value={cohort} />

      <Fieldset legend="신청자 정보">
        <p className="font-display text-sm text-fg-subtle">
          신청 기수:{' '}
          <span className="text-fg-primary" translate="no">
            {cohort}기
          </span>
        </p>
        <Field name="name" label="이름" required maxLength={80} />
        <Field
          name="email"
          label="이메일 (포털 로그인 계정)"
          required
          type="email"
          maxLength={254}
          autoComplete="email"
          hint="구글 로그인이 되는 주소를 적어주세요. 이 주소로만 포털에 들어갈 수 있습니다."
        />
        <Field
          name="email_confirm"
          label="이메일 확인"
          required
          type="email"
          maxLength={254}
          autoComplete="off"
          hint="오타를 막기 위해 한 번 더 입력해주세요."
        />
        <Field
          name="phone"
          label="연락처 (예: 010-0000-0000)"
          required
          type="tel"
          autoComplete="tel"
          pattern="[0-9+\-\s()]{7,20}"
          title="숫자와 하이픈(-)으로 입력해주세요"
        />
      </Fieldset>

      <Fieldset legend="학적 정보 (선택)">
        <Field name="student_id" label="학번" maxLength={20} />
        <Field name="college" label="단과대" maxLength={60} />
        <Field name="major" label="전공" maxLength={60} />
      </Fieldset>

      <div className="border-t border-border pt-8">
        <PrivacyConsent text={CONSENT_TEXT} />
      </div>

      {result.status === 'notice' && (
        <p
          aria-live="polite"
          className="border border-border-strong px-4 py-3 font-display text-sm leading-relaxed text-fg-subtle"
        >
          {result.message}
        </p>
      )}
      {errorMessage && (
        <p aria-live="polite" className="text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        translate="no"
        className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60 md:text-xs"
      >
        {pending ? '신청 중…' : '등록 신청하기'}
        <span aria-hidden>→</span>
      </button>
    </form>
  )
}

function Success() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])
  return (
    <div ref={ref} className="border border-border bg-bg-base p-8">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
      >
        RECEIVED
      </p>
      <p className="mt-4 font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
        등록 신청이 접수되었습니다.
      </p>
      <p className="mt-3 font-display text-sm leading-[1.8] text-fg-subtle md:text-base">
        운영진 승인 후 포털에 입장하실 수 있습니다. 승인이 끝나면 신청하신
        이메일 주소로 구글 로그인해주세요. 주소를 잘못 적었다면 운영진에게
        알려주셔야 합니다.
      </p>
    </div>
  )
}

function Fieldset({
  legend,
  children,
}: {
  legend: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="grid grid-cols-1 gap-6 border-t border-border pt-8">
      <legend
        translate="no"
        className="-mt-12 mb-2 bg-bg-base pr-4 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
      >
        {legend}
      </legend>
      {children}
    </fieldset>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required,
  maxLength,
  pattern,
  title,
  hint,
  autoComplete,
}: {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel'
  required?: boolean
  maxLength?: number
  pattern?: string
  title?: string
  hint?: string
  autoComplete?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>
          {label}
          {required && (
            <span aria-hidden className="ml-1 text-accent">
              *
            </span>
          )}
        </span>
        <input
          type={type}
          name={name}
          required={required}
          maxLength={maxLength}
          pattern={pattern}
          title={title}
          autoComplete={autoComplete}
          className={INPUT_CLASS}
        />
      </label>
      {hint && (
        <span className="font-display text-xs leading-relaxed text-fg-muted">
          {hint}
        </span>
      )}
    </div>
  )
}
