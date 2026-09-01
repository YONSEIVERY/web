'use client'
import { useOptimistic, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { setApplicationRegistration } from '@/app/admin/actions/applications'
import {
  REGISTRATION_INITIAL,
  REGISTRATION_LABELS,
  REGISTRATION_VALUES,
  type RegistrationValue,
} from '@/app/admin/actions/applications-state'

/**
 * 지원자 한 명의 등록 회신 컨트롤. 목록에서 바로 바꾼다.
 *
 * 한 라운드에서 20명 넘는 회신을 연달아 입력하므로 저장 버튼을 두지 않고
 * 값을 고르는 즉시 제출한다(publish-toggle.tsx의 "즉시 반영" 관행).
 * 확인 대화상자도 두지 않는다. 판단 근거는 서버 액션 주석에 적었다.
 *
 * 값은 useOptimistic으로 먼저 보여 준다. 액션이 끝나면 낙관적 값은 사라지고
 * 서버가 준 registration prop이 화면의 진실이 된다. 서버가 받아들이면
 * revalidatePath로 prop이 새 값으로 갱신되고, 거절하면 prop이 옛 값 그대로라
 * 저절로 되돌아온다. 되돌리지 않으면 화면은 "최종등록", DB는 "회신 없음"인
 * 상태가 남아 일괄 등록 인원이 화면과 어긋난다.
 *
 * useState로 값을 들고 useEffect에서 되돌리는 방식은 쓰지 않는다. effect 안의
 * setState는 연쇄 렌더를 만들고(react-hooks/set-state-in-effect), 같은 문구의
 * 거절이 연달아 오면 되돌리기가 한 번만 걸리는 버그도 함께 온다.
 *
 * useActionState 대신 액션을 직접 await하는 이유도 같다. useActionState의
 * dispatch는 void를 돌려주므로 감싸면 폼 액션이 즉시 끝나 버리고, 서버 응답을
 * 기다리기 전에 낙관적 값이 풀린다.
 */
export function RegistrationSelect({
  applicationId,
  applicantName,
  registration,
  finalPass,
}: {
  applicationId: string
  applicantName: string
  registration: RegistrationValue
  finalPass: boolean
}) {
  const [value, setValue] = useOptimistic(registration)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      action={async (formData: FormData) => {
        const raw = String(formData.get('registration') ?? '')
        if (REGISTRATION_VALUES.includes(raw as RegistrationValue))
          setValue(raw as RegistrationValue)
        setError(null)
        const result = await setApplicationRegistration(
          REGISTRATION_INITIAL,
          formData,
        )
        setError(result.error)
      }}
      className="flex flex-col gap-1.5"
    >
      <input type="hidden" name="application_id" value={applicationId} />
      <Field
        applicantName={applicantName}
        value={value}
        finalPass={finalPass}
      />
      {!finalPass && registration !== 'pending' ? (
        <p className="max-w-[20ch] text-[11px] leading-relaxed text-red-400">
          최종 합격이 아닌데 회신 값이 남아 있습니다. 확인해주세요.
        </p>
      ) : null}
      {error ? (
        <p
          role="status"
          className="max-w-[20ch] text-[11px] leading-relaxed text-red-400"
        >
          {error}
        </p>
      ) : null}
    </form>
  )
}

const TONE: Record<RegistrationValue, string> = {
  pending: 'text-fg-muted',
  registered: 'text-green-600',
  declined: 'text-red-400',
}

function Field({
  applicantName,
  value,
  finalPass,
}: {
  applicantName: string
  value: RegistrationValue
  finalPass: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <select
      name="registration"
      value={value}
      disabled={pending}
      aria-label={`${applicantName} 등록 회신`}
      aria-busy={pending}
      onChange={(e) => {
        // 값을 고르는 즉시 저장한다. DOM에는 이미 새 값이 들어 있으므로
        // 폼 액션이 읽는 FormData에는 새 값이 담긴다.
        e.currentTarget.form?.requestSubmit()
      }}
      className={`min-h-11 whitespace-nowrap border border-border bg-bg-base px-2 py-2 text-base focus:border-fg-primary focus:outline-none disabled:opacity-50 md:min-h-9 md:text-sm ${TONE[value]}`}
    >
      {REGISTRATION_VALUES.map((v) => (
        <option
          key={v}
          value={v}
          // 최종 합격이 아닌 사람을 등록됨으로 두면 일괄 등록이 그 사람을
          // 명부에 넣는다. 서버도 같은 판정을 하지만 화면에서 먼저 막는다.
          disabled={v === 'registered' && !finalPass}
        >
          {REGISTRATION_LABELS[v]}
        </option>
      ))}
    </select>
  )
}
