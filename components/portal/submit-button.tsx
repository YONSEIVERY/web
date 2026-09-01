'use client'

import { useFormStatus } from 'react-dom'

const DISABLED_CLASS = 'disabled:cursor-not-allowed disabled:opacity-60'

/**
 * 포털 관리 폼 공용 제출 버튼. 제출 중에는 비활성화한다.
 * 서버 왕복 동안 버튼이 살아 있으면 연타가 그대로 통과해 같은 항목이 여러 번 생성된다.
 * 부모가 서버 컴포넌트라 폼 안에 인라인으로 둘 수 없어 별도 파일로 뺐다.
 */
export function PortalSubmitButton({
  label,
  className,
  pendingLabel = '저장 중…',
  withArrow = false,
}: {
  label: string
  className: string
  pendingLabel?: string
  withArrow?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} ${DISABLED_CLASS}`}
    >
      {pending ? pendingLabel : label}
      {withArrow && <span aria-hidden>→</span>}
    </button>
  )
}
