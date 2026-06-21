'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitAlumniRegistration } from '@/app/actions/alumni'
import {
  ALUMNI_INITIAL_STATE,
  type AlumniFormState,
} from '@/app/actions/alumni-state'

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none'
const LABEL_CLASS =
  'flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs'

export function AlumniRegistrationForm() {
  const [state, action] = useActionState<AlumniFormState, FormData>(
    submitAlumniRegistration,
    ALUMNI_INITIAL_STATE,
  )
  const [hasCompany, setHasCompany] = useState(false)

  if (state.status === 'success') return <Success />

  return (
    <form action={action} className="grid grid-cols-1 gap-8">
      <Fieldset legend="알럼나이 정보">
        <Field name="name" label="이름" required maxLength={80} />
        <Field
          name="cohort"
          label="기수"
          type="number"
          min={1}
          max={100}
          required
        />
        <Field
          name="email"
          label="이메일 (회신용, 비공개)"
          type="email"
          required
        />
        <Field name="job_title" label="현재 활동/소속" required maxLength={120} />
        <Textarea
          name="bio"
          label="한 줄 소개 (200자 이내)"
          required
          maxLength={200}
        />
        <Field name="linkedin_url" label="LinkedIn URL (선택)" type="url" />
      </Fieldset>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="has_company"
          checked={hasCompany}
          onChange={(e) => setHasCompany(e.target.checked)}
          className="h-4 w-4 border-border accent-fg-primary"
        />
        <span className="font-display text-sm text-fg-subtle">
          본인이 창업한 회사를 함께 등록하기
        </span>
      </label>

      {hasCompany && (
        <Fieldset legend="회사 정보">
          <Field name="company_name" label="회사명" required maxLength={120} />
          <FileField
            name="company_logo"
            label="로고 (2MB 이하 PNG/JPEG/SVG)"
            accept="image/png,image/jpeg,image/svg+xml"
            required
          />
          <Textarea
            name="company_one_liner"
            label="회사 한 줄 설명"
            required
            maxLength={200}
          />
          <SelectField
            name="company_stage"
            label="단계"
            options={[
              { value: '', label: '선택' },
              { value: 'idea', label: 'Idea' },
              { value: 'seed', label: 'Seed' },
              { value: 'seriesA', label: 'Series A' },
              { value: 'seriesB', label: 'Series B' },
              { value: 'growth', label: 'Growth' },
              { value: 'exit', label: 'Exit' },
            ]}
          />
          <Field name="company_website" label="회사 웹사이트 (선택)" type="url" />
        </Fieldset>
      )}

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
      {pending ? '제출 중…' : '등록 신청 보내기'}
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
        등록 신청을 접수했습니다. 회장단 검토 후 메일로 회신드립니다.
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

type FieldProps = {
  name: string
  label: string
  type?: 'text' | 'email' | 'url' | 'number'
  required?: boolean
  maxLength?: number
  min?: number
  max?: number
}

function Field({
  name,
  label,
  type = 'text',
  required,
  maxLength,
  min,
  max,
}: FieldProps) {
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
        min={min}
        max={max}
        className={INPUT_CLASS}
      />
    </label>
  )
}

type TextareaProps = {
  name: string
  label: string
  required?: boolean
  maxLength?: number
}

function Textarea({ name, label, required, maxLength }: TextareaProps) {
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
      <textarea
        name={name}
        rows={4}
        required={required}
        maxLength={maxLength}
        className={`${INPUT_CLASS} resize-y`}
      />
    </label>
  )
}

function FileField({
  name,
  label,
  accept,
  required,
}: {
  name: string
  label: string
  accept: string
  required?: boolean
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
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="block w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary file:mr-4 file:border-0 file:bg-transparent file:font-mono file:text-[10px] file:uppercase file:tracking-[0.32em] file:text-fg-primary focus:border-fg-primary focus:outline-none"
      />
    </label>
  )
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string
  label: string
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{label}</span>
      <select name={name} className={INPUT_CLASS}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
