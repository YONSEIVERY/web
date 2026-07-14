'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitDemodayAttendee } from '@/app/actions/demoday'
import {
  DEMODAY_INITIAL_STATE,
  type DemodayFormState,
} from '@/app/actions/demoday-state'

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none'
const LABEL_CLASS =
  'flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs'

type Props = {
  purposes: string[]
  roles: string[]
  sources: string[]
  afterpartyEnabled: boolean
}

export function DemodayAttendeeForm({
  purposes,
  roles,
  sources,
  afterpartyEnabled,
}: Props) {
  const [state, action] = useActionState<DemodayFormState, FormData>(
    submitDemodayAttendee,
    DEMODAY_INITIAL_STATE,
  )
  const [isAlumni, setIsAlumni] = useState<'yes' | 'no' | ''>('')

  if (state.status === 'success') return <Success />

  return (
    <form action={action} className="grid grid-cols-1 gap-8">
      {/* honeypot — 실제 사용자에게는 보이지 않음 */}
      <input
        type="text"
        name="website_hp"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <Fieldset legend="신청자 정보">
        <Field name="name" label="이름" required maxLength={80} />
        <Field
          name="affiliation"
          label="소속 (학교/기관/회사 · 자유 기재)"
          required
          maxLength={120}
        />
        <Field name="phone" label="연락처" required type="tel" />
        <Field name="email" label="이메일" required type="email" />
      </Fieldset>

      <Fieldset legend="VERY 동문 여부">
        <RadioGroup
          name="is_very_alumni"
          options={[
            { value: 'yes', label: '네, 동문입니다' },
            { value: 'no', label: '아닙니다' },
          ]}
          required
          value={isAlumni}
          onChange={(v) => setIsAlumni(v as 'yes' | 'no')}
        />
        {isAlumni === 'yes' && (
          <Field
            name="very_cohort"
            label="기수 (예: 42)"
            type="number"
            min={1}
            max={100}
            required
          />
        )}
        {isAlumni === 'yes' && afterpartyEnabled && (
          <RadioGroup
            name="attend_afterparty"
            label="뒷풀이 참석 여부 (선택)"
            options={[
              { value: 'yes', label: '참석' },
              { value: 'no', label: '불참' },
            ]}
          />
        )}
      </Fieldset>

      {purposes.length > 0 && (
        <Fieldset legend="참가 목적 (다중 선택)">
          <CheckboxGroup name="purposes" options={purposes} required />
        </Fieldset>
      )}

      {roles.length > 0 && (
        <Fieldset legend="현재 역할">
          <RadioGroup name="role" options={roles.map((r) => ({ value: r, label: r }))} required />
        </Fieldset>
      )}

      {sources.length > 0 && (
        <Fieldset legend="알게 된 경로 (다중 선택)">
          <CheckboxGroup name="referral_sources" options={sources} />
        </Fieldset>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="privacy_consent"
          required
          className="mt-1 h-4 w-4 border-border accent-fg-primary"
        />
        <span className="font-display text-sm text-fg-subtle leading-relaxed">
          참관 운영 목적으로 위 정보의 수집·이용에 동의합니다. 행사 종료 후
          1년이 지나면 학회가 명단을 파기합니다.
        </span>
      </label>

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
      {pending ? '제출 중…' : '참관 신청 보내기'}
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
        참관 신청을 접수했습니다. 행사 안내는 메일로 회신드립니다.
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
  type?: 'text' | 'email' | 'url' | 'number' | 'tel'
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

type Option = { value: string; label: string }

function RadioGroup({
  name,
  label,
  options,
  required,
  value,
  onChange,
}: {
  name: string
  label?: string
  options: Option[]
  required?: boolean
  value?: string
  onChange?: (next: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <span className={LABEL_CLASS}>
          {label}
          {required && (
            <span aria-hidden className="ml-1 text-accent">
              *
            </span>
          )}
        </span>
      )}
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 cursor-pointer hover:border-fg-primary"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              required={required}
              checked={value === undefined ? undefined : value === opt.value}
              onChange={onChange ? (e) => onChange(e.target.value) : undefined}
              className="h-4 w-4 border-border accent-fg-primary"
            />
            <span className="font-display text-sm text-fg-primary">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

function CheckboxGroup({
  name,
  options,
  required,
}: {
  name: string
  options: string[]
  required?: boolean
}) {
  // HTML 표준상 group으로 required를 강제할 수 없어 서버 액션이 최소 1개를 검증한다.
  void required
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((opt) => (
        <label
          key={opt}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 cursor-pointer hover:border-fg-primary"
        >
          <input
            type="checkbox"
            name={name}
            value={opt}
            className="h-4 w-4 border-border accent-fg-primary"
          />
          <span className="font-display text-sm text-fg-primary">{opt}</span>
        </label>
      ))}
    </div>
  )
}
