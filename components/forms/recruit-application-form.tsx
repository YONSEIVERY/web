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

const DRAFT_KEY = 'very:recruit-draft'
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000
const DRAFT_FIELDS = [
  'name',
  'phone',
  'email',
  'remote_interview_reason',
] as const

type Draft = Record<string, string>

/**
 * 작성 중인 텍스트 입력을 브라우저에만 임시 보관한다. 파일은 저장하지
 * 않는다. 접수 성공 시 즉시 지우고, 방치된 초안도 7일이 지나면 버린다.
 * 서버로 보내지 않으므로 개인정보 수집 항목에는 변화가 없다.
 */
function readDraft(): { values: Draft; savedAt: number } | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { savedAt?: number; values?: Draft }
    if (!parsed.savedAt || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(DRAFT_KEY)
      return null
    }
    if (!parsed.values) return null
    return { values: parsed.values, savedAt: parsed.savedAt }
  } catch {
    return null
  }
}

/** 저장에 성공하면 저장 시각을, 막힌 환경이면 null을 돌려준다. */
function writeDraft(values: Draft): number | null {
  const savedAt = Date.now()
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt, values }))
    return savedAt
  } catch {
    // 프라이빗 모드 등 저장이 막힌 환경에서는 조용히 넘어간다
    return null
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // 위와 같음
  }
}

/** 초안 대상 필드의 DOM 요소. 폼이 비제어라 값은 DOM에서 직접 읽고 쓴다. */
function draftField(form: HTMLFormElement, name: string) {
  const el = form.elements.namedItem(name)
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
    ? el
    : null
}

/**
 * 파일 3종은 서명 업로드 티켓으로 브라우저에서 스토리지에 직접 올린다
 * (서버 경유 시 Vercel 4.5MB 제한). 제출 흐름: 검증 → 티켓 발급 →
 * 직접 업로드 → 접수 확정. 실패해도 입력값은 그대로 남고, 텍스트 입력은
 * 브라우저에 임시 저장돼 새로고침 뒤에도 복구된다 (파일은 제외).
 */
export function RecruitApplicationForm() {
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'submitting'>(
    'idle',
  )
  const [result, setResult] = useState<RecruitFormState>(RECRUIT_INITIAL_STATE)
  const [fileError, setFileError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [restored, setRestored] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const startedRef = useRef(false)

  // 쓰다 만 초안이 있으면 비제어 입력에 직접 채워 넣는다.
  useEffect(() => {
    const draft = readDraft()
    const form = formRef.current
    if (!draft || !form) return
    let filled = false
    for (const name of DRAFT_FIELDS) {
      const value = draft.values[name]
      if (!value) continue
      const el = draftField(form, name)
      if (!el) continue
      el.value = value
      filled = true
    }
    if (filled) {
      setRestored(true)
      setSavedAt(draft.savedAt)
    }
  }, [])

  const onFormInput = () => {
    if (!startedRef.current) {
      startedRef.current = true
      track('recruit_form_start')
    }
    const form = formRef.current
    if (!form) return
    const values: Draft = {}
    for (const name of DRAFT_FIELDS)
      values[name] = draftField(form, name)?.value ?? ''
    const at = writeDraft(values)
    if (at === null) return
    // 표시는 분 단위다. 같은 분이면 이전 값을 그대로 둬 글자마다
    // 리렌더가 걸리지 않게 한다.
    setSavedAt((prev) =>
      prev !== null && Math.floor(prev / 60000) === Math.floor(at / 60000)
        ? prev
        : at,
    )
  }

  const discardDraft = () => {
    clearDraft()
    const form = formRef.current
    if (form)
      for (const name of DRAFT_FIELDS) {
        const el = draftField(form, name)
        if (el) el.value = ''
      }
    setRestored(false)
    setSavedAt(null)
  }

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
      track('recruit_submit_failed', { stage: 'validate' })
      return
    }
    const { app, plan, zip } = checked

    // 어느 단계에서 끊겼는지 계측한다. 간헐 503 제보를 판정할 근거가 된다.
    let failStage = 'ticket'
    try {
      setPhase('uploading')
      const req: { kind: string; ext: string }[] = [
        { kind: 'application', ext: ext(app) },
      ]
      if (plan) req.push({ kind: 'business_plan', ext: ext(plan) })
      if (zip) req.push({ kind: 'portfolio', ext: ext(zip) })

      const ticketRes = await createRecruitUploadTickets(req)
      if (!ticketRes.ok) throw new Error(ticketRes.error)

      failStage = 'upload'
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
      failStage = 'submit'
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
      if (res.status === 'success') {
        track('recruit_submitted')
        clearDraft()
      } else {
        track('recruit_submit_failed', { stage: 'rejected' })
      }
      setResult(res)
    } catch (err) {
      track('recruit_submit_failed', { stage: failStage })
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
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onInput={onFormInput}
      className="grid grid-cols-1 gap-8"
    >
      {restored && (
        <div className="flex flex-wrap items-baseline justify-between gap-3 border border-border px-4 py-3">
          <p className="font-display text-xs leading-relaxed text-fg-subtle md:text-sm">
            이전에 작성하던 내용을 불러왔습니다. 파일은 다시 첨부해주세요.
          </p>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 font-display text-xs text-fg-muted underline underline-offset-4 transition-colors hover:text-fg-primary"
          >
            새로 작성
          </button>
        </div>
      )}

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
        {/* 유입 상당수가 인스타그램(모바일)인데 첨부는 폰에서 번거롭다.
            좁은 화면에서만 안내를 띄워 이탈 대신 PC 재방문으로 돌린다. */}
        <p className="border border-border px-4 py-3 font-display text-xs leading-relaxed text-fg-subtle md:hidden">
          휴대폰에서는 파일을 찾아 첨부하기 번거로울 수 있습니다. 가능하면
          PC에서 제출해주세요.
        </p>
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

      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
        <DraftNote savedAt={savedAt} />
      </div>
    </form>
  )
}

/**
 * 임시 저장은 자동이라 누를 버튼이 없다. 저장되고 있다는 사실이 보이지
 * 않으면 기능이 없는 것과 같아서, 저장 여부와 시각을 여기서 알린다.
 */
function DraftNote({ savedAt }: { savedAt: number | null }) {
  if (savedAt === null)
    return (
      <span className="font-display text-xs text-fg-muted">
        작성 내용은 이 브라우저에 자동 저장됩니다. 파일은 저장되지 않습니다.
      </span>
    )
  return (
    <span className="font-display text-xs text-fg-muted">
      <span translate="no">
        {new Intl.DateTimeFormat('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(savedAt))}
      </span>{' '}
      임시 저장됨. 창을 닫아도 이어서 작성할 수 있습니다.
    </span>
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
