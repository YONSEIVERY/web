/**
 * 학회원 자율 등록(/join) 폼 상태.
 *
 * `notice`는 실패가 아니라 "이미 처리된 상태"를 알리는 안내다. 중복 신청과
 * 기등록 학회원을 빨간 오류로 띄우면 본인은 잘못한 게 없는데 실패로 읽혀
 * 운영진에게 문의가 몰린다. 그래서 error와 색·문구를 분리한다.
 */
export type MemberSignupState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'notice'; message: string }
  | { status: 'error'; message: string }

export const MEMBER_SIGNUP_INITIAL_STATE: MemberSignupState = { status: 'idle' }
