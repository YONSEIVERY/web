'use client'
import { useEffect, useRef, useState } from 'react'
import { track } from '@vercel/analytics'
import { createClient } from '@/lib/supabase/browser'
import {
  createRecruitUploadTickets,
  submitRecruitApplication,
} from '@/app/actions/recruit'
import {
  RECRUIT_INITIAL_STATE,
  type RecruitFormState,
} from '@/app/actions/recruit-state'
import { RECRUIT } from '@/lib/content/recruit'

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none'
const LABEL_CLASS =
  'flex items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs'
const FILE_INPUT_CLASS =
  'block w-full border border-border bg-bg-base px-4 py-3 font-display text-sm text-fg-primary file:mr-4 file:border-0 file:bg-transparent file:font-mono file:text-[10px] file:uppercase file:tracking-[0.32em] file:text-fg-primary focus:border-fg-primary focus:outline-none'

const MB = 1024 * 1024
const PLAN_EXTS = ['pdf', 'doc', 'docx', 'hwp', 'hwpx', 'ppt', 'pptx']

/**
 * 파일 3종은 서명 업로드 티켓으로 브라우저에서 스토리지에 직접 올린다
 * (서버 경유 시 Vercel 4.5MB 제한). 제출 흐름: 검증 → 티켓 발급 →
 * 직접 업로드 → 접수 확정. 실패해도 입력값은 그대로 남는다.
 */
export function RecruitApplicationForm() {
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'submitting'>(
    'idle',
  )
  const [result, setResult] = useState<RecruitFormState>(RECRUIT_INITIAL_STATE)
  const [fileError, setFileError] = useState<string | null>(null)

  if (result.status === 'success') return <Success />

  const ext = (f: File) => (f.name.split('.').pop() ?? '').toLowerCase()

  const validateFiles = (
    form: HTMLFormElement,
  ):
    | { error: string }
    | { app: File; plan: File | undefined; zip: File | undefined } => {
    const app = (form.elements.namedItem('application_file') as HTMLInputElement)
      ?.files?.[0]
    const plan = (
      form.elements.namedItem('business_plan_file') as HTMLInputElement
    )?.files?.[0]
    const zip = (form.elements.namedItem('portfolio_file') as HTMLInputElement)
      ?.files?.[0]

    if (!app) return { error: '지원서 PDF를 첨부해주세요.' }
    if (ext(app) !== 'pdf' || app.type !== 'application/pdf')
      return { error: '지원서는 PDF 파일만 가능합니다.' }
    if (app.size > 10 * MB)
      return { error: '지원서가 10MB를 넘습니다. 용량을 줄여주세요.' }
    if (plan) {
      if (!PLAN_EXTS.includes(ext(plan)))
        return {
          error: '사업계획서는 pdf/doc/docx/hwp/hwpx/ppt/pptx만 가능합니다.',
        }
      if (plan.size > 10 * MB) return { error: '사업계획서가 10MB를 넘습니다.' }
    }
    if (zip) {
      if (ext(zip) !== 'zip')
        return { error: '작업물은 ZIP 파일 하나로 압축해주세요.' }
      if (zip.size > 30 * MB) return { error: '작업물이 30MB를 넘습니다.' }
    }
    return { app, plan, zip }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (phase !== 'idle') return
    const form = e.currentTarget
    setFileError(null)

    const checked = validateFiles(form)
    if ('error' in checked) {
      setFileError(checked.error)
      return
    }
    const { app, plan, zip } = checked

    try {
      setPhase('uploading')
      const req: { kind: string; ext: string }[] = [
        { kind: 'application', ext: ext(app) },
      ]
      if (plan) req.push({ kind: 'business_plan', ext: ext(plan) })
      if (zip) req.push({ kind: 'portfolio', ext: ext(zip) })

      const ticketRes = await createRecruitUploadTickets(req)
      if (!ticketRes.ok) throw new Error(ticketRes.error)

      const supabase = createClient()
      const fileByKind: Record<string, File | undefined> = {
        application: app,
        business_plan: plan,
        portfolio: zip,
      }
      for (const ticket of ticketRes.tickets) {
        const file = fileByKind[ticket.kind]
        if (!file)
          throw new Error('업로드 준비가 어긋났습니다. 다시 시도해주세요.')
        const { error: upErr } = await supabase.storage
          .from('recruit-applications')
          .uploadToSignedUrl(ticket.path, ticket.token, file)
        if (upErr)
          throw new Error('파일 업로드에 실패했습니다. 다시 시도해주세요.')
      }

      setPhase('submitting')
      const fd = new FormData(form)
      fd.set('submission_id', ticketRes.submissionId)
      for (const ticket of ticketRes.tickets) {
        fd.set(`${ticket.kind}_path`, ticket.path)
        fd.set(`${ticket.kind}_name`, fileByKind[ticket.kind]?.name ?? '')
      }
      // 원본 File은 서버로 보내지 않는다 (4.5MB 제한 회피가 목적)
      fd.delete('application_file')
      fd.delete('business_plan_file')
      fd.delete('portfolio_file')

      const res = await submitRecruitApplication(RECRUIT_INITIAL_STATE, fd)
      if (res.status === 'success') track('recruit_submitted')
      setResult(res)
    } catch (err) {
      setResult({
        status: 'error',
        message: err instanceof Error ? err.message : '접수에 실패했습니다.',
        values: { name: '', phone: '', email: '', remoteReason: '' },
      })
    } finally {
      setPhase('idle')
    }
  }

  const errorMessage = result.status === 'error' ? result.message : fileError

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8">
      {/* honeypot: 실제 사용자에게는 보이지 않는다 */}
      <input
        type="text"
        name="extra_field_hp"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <Fieldset legend="지원자 정보">
        <Field name="name" label="성함" required maxLength={80} />
        <Field
          name="phone"
          label="연락처 (예: 010-0000-0000)"
          required
          type="tel"
          pattern="[0-9+\-\s()]{7,20}"
          title="숫자와 하이픈(-)으로 입력해주세요"
        />
        <Field name="email" label="이메일" required type="email" />
      </Fieldset>

      <Fieldset legend="파일 제출">
        <FileField
          name="application_file"
          label="지원서 PDF (필수)"
          hint={RECRUIT.howTo.fileRules.application}
          accept="application/pdf"
          required
        />
        <FileField
          name="business_plan_file"
          label="사업계획서 (선택)"
          hint={RECRUIT.howTo.fileRules.businessPlan}
          accept=".pdf,.doc,.docx,.hwp,.hwpx,.ppt,.pptx"
        />
        <FileField
          name="portfolio_file"
          label="작업물 ZIP (선택)"
          hint={RECRUIT.howTo.fileRules.portfolio}
          accept=".zip,application/zip,application/x-zip-compressed"
        />
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
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="privacy_consent"
              required
              className="mt-1 h-4 w-4 border-border accent-fg-primary"
            />
            <span className="font-display text-sm text-fg-subtle leading-relaxed">
              모집 전형 운영을 위해 이름, 연락처, 이메일, 제출 파일과 비대면
              면접 사유(작성 시)를 수집·이용하는 것에 동의합니다. 자료는 모집
              종료 후 1년이 지나면 파기됩니다. 동의를 거부할 권리가 있으며,
              거부 시 지원서 접수가 불가합니다.
            </span>
          </label>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-7 w-fit font-display text-xs text-fg-muted underline underline-offset-4 transition-colors hover:text-fg-primary"
          >
            개인정보처리방침 보기
          </a>
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={phase !== 'idle'}
        translate="no"
        className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60 md:text-xs"
      >
        {phase === 'uploading'
          ? '파일 업로드 중…'
          : phase === 'submitting'
            ? '접수 중…'
            : '지원서 제출하기'}
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

function FileField({
  name,
  label,
  hint,
  accept,
  required,
}: {
  name: string
  label: string
  hint: string
  accept: string
  required?: boolean
}) {
  // 네이티브 파일 입력은 한번 고르면 스스로 비울 수 없다. 잘못 고른 파일
  // (용량 초과 등)을 빼려면 새로고침해야 했던 문제라, 제거 버튼을 단다.
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const clear = () => {
    if (inputRef.current) inputRef.current.value = ''
    setSelected(null)
  }
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
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          required={required}
          onChange={(e) => setSelected(e.target.files?.[0]?.name ?? null)}
          className={FILE_INPUT_CLASS}
        />
      </label>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-xs leading-relaxed text-fg-muted">
          {hint}
        </span>
        {selected && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 font-display text-xs text-fg-muted underline underline-offset-4 transition-colors hover:text-fg-primary"
          >
            파일 제거
          </button>
        )}
      </div>
    </div>
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
}: {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel'
  required?: boolean
  maxLength?: number
  pattern?: string
  title?: string
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
        className={INPUT_CLASS}
      />
    </label>
  )
}
