'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import {
  createIntroPhotoTicket,
  saveMyIntro,
  type IntroItemInput,
} from '@/app/members/actions/intro'
import {
  INTRO_INITIAL_STATE,
  type IntroFormState,
} from '@/app/members/actions/intro-state'

/**
 * 구조화 자기소개 편집 폼 (43기 노션 형식).
 *
 * 저장해도 입력값이 그대로 남는 편집기형 UX라 성공 시 화면 전환 없이
 * 상태 문구만 보여준다. 사진은 세션 기록과 같은 방식으로 서명 업로드
 * 티켓을 받아 브라우저에서 스토리지로 직접 올린다 (서버 경유 시
 * Vercel 요청 본문 4.5MB 제한에 걸린다).
 */

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm'
const LABEL_CLASS =
  'font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs'
const HINT_CLASS = 'font-display text-xs leading-relaxed text-fg-muted'

export type IntroFormInitial = {
  mbti: string
  strengths: IntroItemInput[]
  likes: IntroItemInput[]
  tmi: string
  portfolio: string
  photoPath: string | null
  /** 기존 사진의 서명 읽기 URL. 미리보기 전용이다. */
  photoUrl: string | null
}

type ItemRow = { title: string; body: string }

function padItems(items: IntroItemInput[]): ItemRow[] {
  const rows = items.map((it) => ({
    title: String(it?.title ?? ''),
    body: String(it?.body ?? ''),
  }))
  while (rows.length < 3) rows.push({ title: '', body: '' })
  return rows.slice(0, 3)
}

export function IntroForm({ initial }: { initial: IntroFormInitial }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mbti, setMbti] = useState(initial.mbti)
  const [strengths, setStrengths] = useState<ItemRow[]>(
    padItems(initial.strengths),
  )
  const [likes, setLikes] = useState<ItemRow[]>(padItems(initial.likes))
  const [tmi, setTmi] = useState(initial.tmi)
  const [portfolio, setPortfolio] = useState(initial.portfolio)

  // 사진 상태 3분기: 새 파일(file) > 삭제(removed) > 기존 유지(initial.photoPath)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)

  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<IntroFormState>(INTRO_INITIAL_STATE)

  const pickFile = (list: FileList | null) => {
    setResult(INTRO_INITIAL_STATE)
    const f = list?.[0] ?? null
    if (!f) return
    if (!EXT_BY_MIME[f.type]) {
      setResult({
        status: 'error',
        message: 'JPG/PNG/WEBP 사진만 올릴 수 있습니다.',
      })
      return
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setResult({ status: 'error', message: '사진은 10MB 이하만 가능합니다.' })
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setRemoved(false)
  }

  const removePhoto = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setRemoved(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  const shownPhoto = preview ?? (removed ? null : initial.photoUrl)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setResult(INTRO_INITIAL_STATE)
    try {
      let photoPath = removed ? null : initial.photoPath
      if (file) {
        const ext = EXT_BY_MIME[file.type]
        if (!ext) throw new Error('JPG/PNG/WEBP 사진만 올릴 수 있습니다.')
        const ticket = await createIntroPhotoTicket(ext)
        if (!ticket.ok) throw new Error(ticket.error)
        const supabase = createClient()
        const { error: upErr } = await supabase.storage
          .from('portal-photos')
          .uploadToSignedUrl(ticket.path, ticket.token, file)
        if (upErr) throw new Error('사진 업로드에 실패했습니다.')
        photoPath = ticket.path
      }
      const res = await saveMyIntro({
        mbti,
        strengths,
        likes,
        tmi,
        portfolio,
        photoPath,
      })
      setResult(res)
    } catch (err) {
      setResult({
        status: 'error',
        message:
          err instanceof Error ? err.message : '저장에 실패했습니다.',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-10">
      <Section legend="대표사진">
        {shownPhoto ? (
          // 서명 URL은 만료가 있어 next/image 캐시와 맞지 않는다
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownPhoto}
            alt="대표사진 미리보기"
            className="h-40 w-40 border border-border object-cover"
          />
        ) : (
          <p className={HINT_CLASS}>
            아직 사진이 없습니다. 얼굴이 나온 사진 한 장이면 충분합니다.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => pickFile(e.target.files)}
            className="font-display text-xs text-fg-subtle file:mr-4 file:border file:border-border file:bg-bg-base file:px-4 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.2em] file:text-fg-primary"
          />
          {shownPhoto && (
            <button
              type="button"
              onClick={removePhoto}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted underline hover:text-fg-primary"
            >
              사진 삭제
            </button>
          )}
        </div>
      </Section>

      <Section legend="MBTI">
        <input
          type="text"
          value={mbti}
          onChange={(e) => setMbti(e.target.value)}
          maxLength={4}
          placeholder="ENTJ"
          pattern="[A-Za-z]{4}"
          title="알파벳 4글자로 입력해주세요"
          autoCapitalize="characters"
          className={`${INPUT_CLASS} max-w-[10rem] font-mono uppercase`}
        />
      </Section>

      <ItemsSection
        legend="내가 잘하는 것 3가지"
        rows={strengths}
        onChange={setStrengths}
        bodyPlaceholder="왜 잘하는지, 어떤 이야기가 있는지 한두 문장으로 적어주세요."
      />

      <ItemsSection
        legend="내가 좋아하는 것 3가지"
        rows={likes}
        onChange={setLikes}
        bodyPlaceholder="얼마나, 왜 좋아하는지 한두 문장으로 적어주세요."
      />

      <Section legend="자유로운 TMI">
        <textarea
          value={tmi}
          onChange={(e) => setTmi(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="위 칸에 담지 못한 이야기를 자유롭게 적어주세요. 요즘 배우는 것, 계획, 반전 매력 무엇이든 좋습니다."
          className={`${INPUT_CLASS} leading-[1.8]`}
        />
      </Section>

      <Section legend="개인 포트폴리오">
        <input
          type="text"
          value={portfolio}
          onChange={(e) => setPortfolio(e.target.value)}
          maxLength={300}
          placeholder="노션, 링크드인, 인스타그램 등 링크나 아이디"
          className={INPUT_CLASS}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          translate="no"
          className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60 md:text-xs"
        >
          {pending ? '저장 중…' : '저장하기'}
          <span aria-hidden>→</span>
        </button>
        {result.status === 'success' && (
          <p role="status" className="font-display text-sm text-fg-primary">
            저장되었습니다.
          </p>
        )}
        {result.status === 'error' && (
          <p role="alert" className="text-sm text-red-400">
            {result.message}
          </p>
        )}
      </div>
    </form>
  )
}

function Section({
  legend,
  children,
}: {
  legend: string
  children: React.ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-border pt-6">
      <p translate="no" className={LABEL_CLASS}>
        {legend}
      </p>
      {children}
    </section>
  )
}

function ItemsSection({
  legend,
  rows,
  onChange,
  bodyPlaceholder,
}: {
  legend: string
  rows: ItemRow[]
  onChange: (rows: ItemRow[]) => void
  bodyPlaceholder: string
}) {
  const update = (i: number, patch: Partial<ItemRow>) => {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  return (
    <Section legend={legend}>
      <div className="grid grid-cols-1 gap-5">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="font-mono text-xs tabular-nums text-fg-muted"
              >
                {i + 1}.
              </span>
              <input
                type="text"
                value={row.title}
                onChange={(e) => update(i, { title: e.target.value })}
                maxLength={60}
                placeholder="제목"
                aria-label={`${legend} ${i + 1} 제목`}
                className={INPUT_CLASS}
              />
            </div>
            <div className="pl-7">
              <textarea
                value={row.body}
                onChange={(e) => update(i, { body: e.target.value })}
                rows={2}
                maxLength={600}
                placeholder={bodyPlaceholder}
                aria-label={`${legend} ${i + 1} 설명`}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
