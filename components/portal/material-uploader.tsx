'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import {
  addSessionMaterial,
  createMaterialUploadTicket,
} from '@/app/members/actions/materials'
import {
  FILES_BUCKET,
  FILE_ACCEPT,
  MAX_FILE_BYTES,
  fileExt,
  formatFileSize,
  isAllowedExt,
} from '@/lib/portal/files'

/**
 * 세션 자료 올리기 (임원진, 세션 편집 화면). 파일은 서명 업로드 티켓을
 * 받아 브라우저에서 스토리지로 직접 보낸다. 서버를 거치면 Vercel
 * 요청 본문 4.5MB 제한에 걸려 발표 슬라이드가 통과하지 못한다.
 */
export function MaterialUploader({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = (list: FileList | null) => {
    setError(null)
    const next = list?.[0] ?? null
    if (!next) return setFile(null)
    if (!isAllowedExt(fileExt(next.name))) {
      setFile(null)
      return setError('올릴 수 없는 형식입니다. 필요하면 ZIP으로 묶어주세요.')
    }
    if (next.size > MAX_FILE_BYTES) {
      setFile(null)
      return setError(
        `파일은 ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB 이하만 올릴 수 있습니다.`,
      )
    }
    setFile(next)
  }

  const submit = async () => {
    if (pending || !file) return
    setPending(true)
    setError(null)
    try {
      const ticketRes = await createMaterialUploadTicket(sessionId, file.name)
      if (!ticketRes.ok) throw new Error(ticketRes.error)
      const { path, token, fileName } = ticketRes.ticket

      const supabase = createClient()
      const { error: upErr } = await supabase.storage
        .from(FILES_BUCKET)
        .uploadToSignedUrl(path, token, file)
      if (upErr) throw new Error('파일 업로드에 실패했습니다.')

      const res = await addSessionMaterial(sessionId, path, fileName, label)
      if (!res.ok) throw new Error(res.error)

      setFile(null)
      setLabel('')
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
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
        자료 올리기
      </p>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={120}
        placeholder="자료 이름 (선택). 비우면 파일명이 그대로 보입니다."
        className="mt-4 w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm"
      />
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <input
          ref={fileRef}
          type="file"
          accept={FILE_ACCEPT}
          onChange={(e) => pick(e.target.files)}
          className="block flex-1 font-display text-xs text-fg-subtle file:mr-3 file:border file:border-border file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.24em] file:text-fg-primary"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !file}
          className="border border-fg-primary px-5 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? '올리는 중…' : '올리기'}
        </button>
      </div>
      {file && (
        <p className="mt-2 font-display text-xs text-fg-muted">
          {file.name} · {formatFileSize(file.size)}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
