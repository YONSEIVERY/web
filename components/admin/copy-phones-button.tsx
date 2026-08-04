'use client'
import { useState } from 'react'

/**
 * 상태별 전화번호 일괄 복사. 단체 문자 발송 서비스에 바로 붙여넣는 용도로
 * 하이픈을 제거하고 쉼표로 잇는다 (예: 01012345678,01098765432).
 */
export function CopyPhonesButton({
  label,
  phones,
}: {
  label: string
  phones: string[]
}) {
  const [copied, setCopied] = useState(false)
  const disabled = phones.length === 0

  const onCopy = async () => {
    const text = phones.map((p) => p.replace(/\D/g, '')).join(',')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 권한 실패 시 폴백: 프롬프트로 노출해 수동 복사
      window.prompt('아래 번호를 복사하세요', text)
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
        disabled
          ? 'cursor-not-allowed border-border text-fg-muted opacity-60'
          : copied
            ? 'border-green-600 text-green-600'
            : 'border-border text-fg-subtle hover:border-fg-primary hover:text-fg-primary'
      }`}
    >
      {copied ? '복사됨' : `${label} 번호 (${phones.length})`}
    </button>
  )
}
