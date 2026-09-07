'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import {
  createPostFileTicket,
  createPostUploadTickets,
  createSessionPost,
} from '@/app/members/actions/posts'
import {
  ALLOWED_FILE_EXTS,
  FILES_BUCKET,
  MAX_FILE_BYTES,
  fileExt,
  isAllowedExt,
} from '@/lib/portal/files'

const MAX_IMAGES = 6
const MAX_FILES = 5
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** 사진 칸과 겹치지 않도록 문서·녹음본만 고르게 한다. */
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])
const DOC_ACCEPT = ALLOWED_FILE_EXTS.filter((e) => !IMAGE_EXTS.has(e))
  .map((e) => `.${e}`)
  .join(',')

const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm'
const FILE_INPUT_CLASS =
  'block flex-1 font-display text-xs text-fg-subtle file:mr-3 file:border file:border-border file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.24em] file:text-fg-primary'

/**
 * 학회원 기록 작성 폼. 업로드는 서버를 거치지 않는다. 서명 티켓을 받아
 * 브라우저가 스토리지에 직접 올린다 (서버 경유 시 Vercel 4.5MB 제한).
 *
 * 사진과 파일이 서로 다른 버킷으로 간다. 사진은 화면에 펼쳐 보여줄
 * portal-photos, 녹음본·문서는 내려받기용 portal-files.
 *
 * scope='team'이면 조를 골라야 제출된다. 조 목록은 세션 설정에서 온다.
 */
export function PostComposer({
  sessionId,
  scope = 'individual',
  teams = [],
  label = '기록 남기기',
  placeholder = '소감문, 내용 정리, 사진 한 줄 설명 등 자유롭게 남겨주세요. (마크다운 지원)',
}: {
  sessionId: string
  scope?: 'individual' | 'team'
  teams?: string[]
  label?: string
  placeholder?: string
}) {
  const router = useRouter()
  const imageRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [docs, setDocs] = useState<File[]>([])
  const [team, setTeam] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickImages = (list: FileList | null) => {
    setError(null)
    if (!list) return setImages([])
    const next = [...list]
    if (next.length > MAX_IMAGES)
      return setError(`사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`)
    for (const f of next) {
      if (!EXT_BY_MIME[f.type])
        return setError('JPG/PNG/WEBP/GIF만 첨부할 수 있습니다.')
      if (f.size > MAX_IMAGE_BYTES)
        return setError('사진은 장당 10MB 이하만 가능합니다.')
    }
    setImages(next)
  }

  const pickDocs = (list: FileList | null) => {
    setError(null)
    if (!list) return setDocs([])
    const next = [...list]
    if (next.length > MAX_FILES)
      return setError(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`)
    for (const f of next) {
      if (!isAllowedExt(fileExt(f.name)))
        return setError('올릴 수 없는 형식입니다. 필요하면 ZIP으로 묶어주세요.')
      if (f.size > MAX_FILE_BYTES)
        return setError(
          `파일은 ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB 이하만 가능합니다. 녹음은 m4a로 줄여보세요.`,
        )
    }
    setDocs(next)
  }

  const submit = async () => {
    if (pending) return
    if (!content.trim() && images.length === 0 && docs.length === 0) {
      setError('내용, 사진, 파일 중 하나는 있어야 합니다.')
      return
    }
    if (scope === 'team' && !team) {
      setError('조를 골라주세요.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const supabase = createClient()

      let paths: string[] = []
      if (images.length > 0) {
        const exts = images
          .map((f) => EXT_BY_MIME[f.type])
          .filter((e): e is string => Boolean(e))
        if (exts.length !== images.length)
          throw new Error('JPG/PNG/WEBP/GIF만 첨부할 수 있습니다.')
        const ticketRes = await createPostUploadTickets(sessionId, exts)
        if (!ticketRes.ok) throw new Error(ticketRes.error)
        for (let i = 0; i < images.length; i++) {
          const ticket = ticketRes.tickets[i]
          const file = images[i]
          if (!ticket || !file)
            throw new Error('업로드 준비가 어긋났습니다. 다시 시도해주세요.')
          const { error: upErr } = await supabase.storage
            .from('portal-photos')
            .uploadToSignedUrl(ticket.path, ticket.token, file)
          if (upErr) throw new Error('사진 업로드에 실패했습니다.')
        }
        paths = ticketRes.tickets.map((t) => t.path)
      }

      const uploaded: { path: string; fileName: string }[] = []
      for (const file of docs) {
        const ticketRes = await createPostFileTicket(sessionId, file.name)
        if (!ticketRes.ok) throw new Error(ticketRes.error)
        const { path, token, fileName } = ticketRes.ticket
        const { error: upErr } = await supabase.storage
          .from(FILES_BUCKET)
          .uploadToSignedUrl(path, token, file)
        if (upErr) throw new Error(`${file.name} 업로드에 실패했습니다.`)
        uploaded.push({ path, fileName })
      }

      const res = await createSessionPost(sessionId, {
        contentMd: content,
        imagePaths: paths,
        scope,
        teamLabel: team,
        files: uploaded,
      })
      if (!res.ok) throw new Error(res.error)

      setContent('')
      setImages([])
      setDocs([])
      setTeam('')
      if (imageRef.current) imageRef.current.value = ''
      if (docRef.current) docRef.current.value = ''
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '작성에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="border border-border p-5">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        {label}
      </p>

      {scope === 'team' && (
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className={`${INPUT_CLASS} mt-4`}
        >
          <option value="">조를 골라주세요</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder={placeholder}
        className={`${INPUT_CLASS} mt-3`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <input
          ref={imageRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => pickImages(e.target.files)}
          className={FILE_INPUT_CLASS}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <input
          ref={docRef}
          type="file"
          accept={DOC_ACCEPT}
          multiple
          onChange={(e) => pickDocs(e.target.files)}
          className={FILE_INPUT_CLASS}
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="border border-fg-primary px-5 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? '올리는 중…' : '올리기'}
        </button>
      </div>

      <p className="mt-2 font-display text-xs text-fg-muted">
        위는 사진(장당 10MB, 최대 {MAX_IMAGES}장), 아래는 문서와 녹음본
        (개당 {Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB, 최대 {MAX_FILES}개).
        {images.length > 0 && ` 사진 ${images.length}장`}
        {docs.length > 0 && ` 파일 ${docs.length}개`}
        {(images.length > 0 || docs.length > 0) && ' 첨부됨'}
      </p>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
