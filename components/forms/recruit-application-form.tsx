'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitRecruitApplication } from '@/app/actions/recruit'
import {
  RECRUIT_INITIAL_STATE,
  type RecruitFormState,
} from '@/app/actions/recruit-state'

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none'
const LABEL_CLASS =
  'flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs'
const MAX_FILE_BYTES = 5 * 1024 * 1024

export function RecruitApplicationForm() {
  const [state, action] = useActionState<RecruitFormState, FormData>(
    submitRecruitApplication,
    RECRUIT_INITIAL_STATE,
  )
  const [fileError, setFileError] = useState<string | null>(null)

  if (state.status === 'success') return <Success />

  // React 19는 서버 액션이 끝나면 폼을 리셋한다. 에러 응답이 돌려준 값을
  // defaultValue로 다시 깔아 입력이 날아가지 않게 한다. (key로 리마운트)
  const values =
    state.status === 'error'
      ? state.values
      : { name: '', phone: '', email: '', remoteReason: '' }
  const formKey = state.status === 'error' ? 'retry' : 'initial'

  return (
    <form
      key={formKey}
      action={action}
      onSubmit={(e) => {
        // 5MB 초과·비PDF는 서버도 거부하지만, 프레임워크 바디 한도에 걸려
        // 불친절한 에러가 나기 전에 클라이언트에서 먼저 막는다.
        if (fileError) e.preventDefault()
      }}
      className="grid grid-cols-1 gap-8"
    >
      {/* honeypot · 실제 사용자에게는 보이지 않음. autofill이 건드리지 않도록
          의미 없는 이름을 쓴다. */}
      <input
        type="text"
        name="extra_field_hp"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <Fieldset legend="지원자 정보">
        <Field
          name="name"
          label="성함"
          required
          maxLength={80}
          defaultValue={values.name}
        />
        <Field
          name="phone"
          label="연락처 (예: 010-0000-0000)"
          required
          type="tel"
          pattern="[0-9+\-\s()]{7,20}"
          title="숫자와 하이픈(-)으로 입력해주세요"
          defaultValue={values.phone}
        />
        <Field
          name="email"
          label="이메일"
          required
          type="email"
          defaultValue={values.email}
        />
      </Fieldset>

      <Fieldset legend="지원서 제출">
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>
            지원서 PDF (5MB 이하)
            <span aria-hidden className="ml-1 text-accent">
              *
            </span>
          </span>
          <input
            type="file"
            name="application_file"
            accept="application/pdf"
            required
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return setFileError(null)
              if (f.type !== 'application/pdf')
                return setFileError('PDF 파일만 업로드할 수 있습니다.')
              if (f.size > MAX_FILE_BYTES)
                return setFileError('파일이 5MB를 넘습니다. 용량을 줄여주세요.')
              setFileError(null)
            }}
            className="block w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary file:mr-4 file:border-0 file:bg-transparent file:font-mono file:text-[10px] file:uppercase file:tracking-[0.32em] file:text-fg-primary focus:border-fg-primary focus:outline-none"
          />
          {fileError && <span className="text-sm text-red-600">{fileError}</span>}
        </label>
      </Fieldset>

      <Fieldset legend="비대면 면접 (선택)">
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>
            비대면 면접 희망 시, 사유를 작성해주세요
          </span>
          <textarea
            name="remote_interview_reason"
            rows={4}
            maxLength={1000}
            placeholder="특별한 사유가 있는 경우 비대면 면접을 허용합니다."
            defaultValue={values.remoteReason}
            className={INPUT_CLASS}
          />
        </label>
      </Fieldset>

      <div className="grid grid-cols-1 gap-4 border-t border-border pt-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="notice_ack"
            required
            className="mt-1 h-4 w-4 border-border accent-fg-primary"
          />
          <span className="font-display text-sm text-fg-subtle leading-relaxed">
            지원 전 유의사항(활동 기간·필참 일정·출결 규정)을 모두
            확인했습니다.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="privacy_consent"
            required
            className="mt-1 h-4 w-4 border-border accent-fg-primary"
          />
          <span className="font-display text-sm text-fg-subtle leading-relaxed">
            모집 운영 목적으로 위 정보와 지원서의 수집·이용에 동의합니다.
            모집 종료 후 1년이 지나면 학회가 자료를 파기합니다.
          </span>
        </label>
      </div>

      {state.status === 'error' && (
        <p className="text-sm text-red-600">
          {state.message}
          <br />
          <span className="text-fg-muted">
            보안상 지원서 PDF는 다시 첨부해주셔야 합니다. 나머지 입력은
            유지됩니다.
          </span>
        </p>
      )}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      translate="no"
      className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60 md:text-xs"
    >
      {pending ? '제출 중…' : '지원서 제출하기'}
      <span aria-hidden>→</span>
    </button>
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
        지원서가 접수되었습니다.
      </p>
      <p className="mt-3 font-display text-sm leading-[1.8] text-fg-subtle md:text-base">
        서류 결과와 면접 일정은 작성해주신 연락처로 안내드립니다. VERY 44기에
        지원해주셔서 감사합니다.
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
  defaultValue,
}: {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel'
  required?: boolean
  maxLength?: number
  pattern?: string
  title?: string
  defaultValue?: string
}) {
  return (
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
        defaultValue={defaultValue}
        className={INPUT_CLASS}
      />
    </label>
  )
}
