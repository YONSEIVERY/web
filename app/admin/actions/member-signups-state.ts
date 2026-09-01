export type MemberSignupActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export const MEMBER_SIGNUP_ACTION_INITIAL: MemberSignupActionState = {
  status: 'idle',
}
