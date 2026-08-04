/**
 * 개인정보 수집·이용 동의 블록. PII를 받는 모든 공개 폼에 넣는다.
 * 문구는 /privacy 방침의 해당 수집 창구 항목과 일치해야 한다
 * (목적, 항목, 보유기간, 거부권·불이익). 서버 액션도 `privacy_consent`를
 * 필수로 검증할 것.
 */
export function PrivacyConsent({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="privacy_consent"
          required
          className="mt-1 h-4 w-4 border-border accent-fg-primary"
        />
        <span className="font-display text-sm text-fg-subtle leading-relaxed">
          {text}
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
  )
}
