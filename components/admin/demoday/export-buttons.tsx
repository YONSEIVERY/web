'use client'

import { useState } from 'react'

type Kind = 'xlsx' | 'csv'

/**
 * 신청자 명단 다운로드 버튼.
 *
 * 기존에는 `<a href=".../export.csv">` 단순 링크였는데, 모바일 브라우저
 * (특히 iOS Safari)는 첨부(attachment) 응답으로의 네비게이션을 다운로드로
 * 처리하지 못해 "아무것도 안 받아지는" 문제가 있었다. 여기서는 파일을
 * fetch로 받아 Blob으로 만든 뒤 `a.download`로 내려받아 모바일에서도
 * 확실히 저장되게 한다.
 */
export function ExportAttendeesButtons({ eventId }: { eventId: string }) {
  const [busy, setBusy] = useState<Kind | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function download(kind: Kind) {
    setError(null)
    setBusy(kind)
    try {
      const res = await fetch(
        `/admin/demoday/${eventId}/attendees/export.${kind}`,
        { credentials: 'same-origin' },
      )
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? '권한이 없습니다. 다시 로그인해 주세요.'
            : `다운로드 실패 (${res.status})`,
        )
      }
      const blob = await res.blob()
      const cd = res.headers.get('content-disposition') ?? ''
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd)
      const filename = match
        ? decodeURIComponent(match[1] ?? match[2] ?? '')
        : `demoday-attendees.${kind}`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '다운로드 중 오류가 발생했습니다.',
      )
    } finally {
      setBusy(null)
    }
  }

  const btn =
    'border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary hover:bg-fg-primary hover:text-bg-base disabled:opacity-50'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => download('xlsx')}
        disabled={busy !== null}
        className={btn}
      >
        {busy === 'xlsx' ? '내려받는 중…' : '엑셀(.xlsx) 다운로드'}
      </button>
      <button
        type="button"
        onClick={() => download('csv')}
        disabled={busy !== null}
        className={btn}
      >
        {busy === 'csv' ? '내려받는 중…' : 'CSV 다운로드'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
