'use client'
import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { submitPartnerApplication } from '@/app/actions/partners'
import {
  PARTNER_INITIAL_STATE,
  type PartnerFormState,
} from '@/app/actions/partners-state'

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none'
const LABEL_CLASS =
  'flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs'

export function PartnerApplicationForm() {
  const [state, action] = useActionState<PartnerFormState, FormData>(
    submitPartnerApplication,
    PARTNER_INITIAL_STATE,
  )

  if (state.status === 'success') return <SuccessBlock />

  return (
    <form action={action} className="grid grid-cols-1 gap-6">
      <input
        type="text"
        name="website_hp"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        aria-hidden
      />

      <Field name="name" label="회사명" required maxLength={120} />
      <RadioRow
        name="category"
        label="카테고리"
        options={[
          { value: 'CORPORATE', label: '기업' },
          { value: 'CAPITAL', label: '캐피털' },
          { value: 'ACADEMIC', label: '학계' },
        ]}
      />
      <Field
        name="one_liner"
        label="한 줄 설명"
        required
        maxLength={200}
      />
      <FileField
        name="logo"
        label="회사 로고 (선택, 2MB 이하 PNG/JPEG/SVG)"
      />
      <Field name="applicant_name" label="신청자 이름" required maxLength={80} />
      <Field
        name="applicant_email"
        label="신청자 이메일"
        type="email"
        required
      />
      <Textarea name="applicant_note" label="추가 메모 (선택)" />

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
      {pending ? '제출 중…' : '신청서 보내기'}
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
        신청서를 받았습니다.
      </p>
      <p className="mt-3 max-w-[48ch] text-sm leading-[1.7] text-fg-subtle md:text-base">
        검토 후 신청자 이메일로 회신드립니다. 학기 일정에 따라 회신까지 며칠
        걸릴 수 있습니다.
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

function Textarea({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{label}</span>
      <textarea
        name={name}
        rows={4}
        maxLength={2000}
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

function FileField({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{label}</span>
      <input
        type="file"
        name={name}
        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
        className="block w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary file:mr-4 file:border-0 file:bg-transparent file:font-mono file:text-[10px] file:uppercase file:tracking-[0.32em] file:text-fg-primary focus:border-fg-primary focus:outline-none"
      />
    </label>
  )
}
