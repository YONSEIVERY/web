'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import {
  createPostUploadTickets,
  createSessionPost,
} from '@/app/members/actions/posts'

const MAX_IMAGES = 6
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/**
 * 학회원 기록 작성 폼. 사진은 서명 업로드 티켓을 받아 브라우저에서
 * 스토리지로 직접 올린다 (서버 경유 시 Vercel 4.5MB 제한에 걸린다).
 */
export function PostComposer({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFiles = (list: FileList | null) => {
    setError(null)
    if (!list) return setFiles([])
    const next = [...list]
    if (next.length > MAX_IMAGES)
      return setError(`사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`)
    for (const f of next) {
      if (!EXT_BY_MIME[f.type])
        return setError('JPG/PNG/WEBP/GIF만 첨부할 수 있습니다.')
      if (f.size > MAX_IMAGE_BYTES)
        return setError('사진은 장당 10MB 이하만 가능합니다.')
    }
    setFiles(next)
  }

  const submit = async () => {
    if (pending) return
    if (!content.trim() && files.length === 0) {
      setError('내용이나 사진 중 하나는 있어야 합니다.')
      return
    }
    setPending(true)
    setError(null)
    try {
      let paths: string[] = []
      if (files.length > 0) {
        const exts = files
          .map((f) => EXT_BY_MIME[f.type])
          .filter((e): e is string => Boolean(e))
        if (exts.length !== files.length)
          throw new Error('JPG/PNG/WEBP/GIF만 첨부할 수 있습니다.')
        const ticketRes = await createPostUploadTickets(sessionId, exts)
        if (!ticketRes.ok) throw new Error(ticketRes.error)
        const supabase = createClient()
        for (let i = 0; i < files.length; i++) {
          const ticket = ticketRes.tickets[i]
          const file = files[i]
          if (!ticket || !file)
            throw new Error('업로드 준비가 어긋났습니다. 다시 시도해주세요.')
          const { error: upErr } = await supabase.storage
            .from('portal-photos')
            .uploadToSignedUrl(ticket.path, ticket.token, file)
          if (upErr) throw new Error('사진 업로드에 실패했습니다.')
        }
        paths = ticketRes.tickets.map((t) => t.path)
      }
      const res = await createSessionPost(sessionId, content, paths)
      if (!res.ok) throw new Error(res.error)
      setContent('')
      setFiles([])
      if (fileRef.current) fileRef.current.value = ''
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
        기록 남기기
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder="소감문, 내용 정리, 사진 한 줄 설명 등 자유롭게 남겨주세요. (마크다운 지원)"
        className="mt-4 w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm"
      />
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => pickFiles(e.target.files)}
          className="block flex-1 font-display text-xs text-fg-subtle file:mr-3 file:border file:border-border file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.24em] file:text-fg-primary"
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
      {files.length > 0 && (
        <p className="mt-2 font-display text-xs text-fg-muted">
          사진 {files.length}장 첨부됨 (장당 10MB, 최대 {MAX_IMAGES}장)
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
