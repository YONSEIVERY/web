'use client'
import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { submitIndustryInquiry } from '@/app/actions/inquiries'
import {
  INITIAL_STATE,
  type InquiryFormState,
} from '@/app/actions/inquiries-state'

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none'
const LABEL_CLASS =
  'flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs'

export function IndustryInquiryForm() {
  const [state, action] = useActionState<InquiryFormState, FormData>(
    submitIndustryInquiry,
    INITIAL_STATE,
  )

  if (state.status === 'success') return <SuccessBlock />

  return (
    <form action={action} className="grid grid-cols-1 gap-6">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        aria-hidden
      />

      <Field name="company" label="회사명" required />
      <Field name="name" label="담당자 이름" required />
      <Field name="email" label="이메일" type="email" required />
      <RadioRow
        name="subject"
        label="문의 분류"
        options={[
          { value: '멘토링', label: '멘토링' },
          { value: '세션 진행', label: '세션 진행' },
          { value: '공동 프로젝트', label: '공동 프로젝트' },
          { value: '기타', label: '기타' },
        ]}
      />
      <Textarea
        name="message"
        label="상세 메시지"
        required
        minLength={10}
        maxLength={2000}
      />

      {state.status === 'error' && (
        <p className="text-sm text-red-600">{state.message}</p>
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
      {pending ? '제출 중…' : '문의 보내기'}
      <span aria-hidden>→</span>
    </button>
  )
}

function SuccessBlock() {
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
        산학협력 문의를 접수했습니다. 회장단이 회신드립니다.
      </p>
    </div>
  )
}

type FieldProps = {
  name: string
  label: string
  type?: 'text' | 'email'
  required?: boolean
  maxLength?: number
}

function Field({ name, label, type = 'text', required, maxLength }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>
        {label}
        {required && <span aria-hidden className="ml-1 text-accent">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        maxLength={maxLength}
        className={INPUT_CLASS}
      />
    </label>
  )
}

type TextareaProps = {
  name: string
  label: string
  required?: boolean
  minLength?: number
  maxLength?: number
}

function Textarea({ name, label, required, minLength, maxLength }: TextareaProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>
        {label}
        {required && <span aria-hidden className="ml-1 text-accent">*</span>}
      </span>
      <textarea
        name={name}
        rows={6}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className={`${INPUT_CLASS} resize-y`}
      />
    </label>
  )
}

function RadioRow({
  name,
  label,
  options,
}: {
  name: string
  label: string
  options: { value: string; label: string }[]
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={LABEL_CLASS}>
        {label}
        <span aria-hidden className="ml-1 text-accent">
          *
        </span>
      </legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 font-display text-sm text-fg-primary"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              required
              className="h-4 w-4 border-border accent-fg-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
