/**
 * 지원서 액션의 상태 타입. 'use server' 파일은 async 함수만 내보낼 수 있어
 * 값·타입은 여기에 둔다(publish-state.ts와 같은 관행).
 *
 * 등록 회신(applications.registration)은 심사 결과(status)와 다른 층의
 * 사실이다. status는 학회가 내린 판정이고, registration은 본인이 낸 회신이다.
 * 두 값을 한 컬럼에 섞으면 "합격했는데 등록을 안 함"과 "불합격"을 구분할 수
 * 없어진다. 그래서 값 집합도 따로 둔다.
 */

export const REGISTRATION_VALUES = [
  'pending',
  'registered',
  'declined',
] as const

export type RegistrationValue = (typeof REGISTRATION_VALUES)[number]

/** 화면에는 대표가 쓰는 말만 노출한다. 영어 값은 DB 안에만 남는다. */
export const REGISTRATION_LABELS: Record<RegistrationValue, string> = {
  pending: '회신 없음',
  registered: '최종등록',
  declined: '최종미등록',
}

export type RegistrationState = { ok: boolean; error: string | null }

export const REGISTRATION_INITIAL: RegistrationState = {
  ok: false,
  error: null,
}
