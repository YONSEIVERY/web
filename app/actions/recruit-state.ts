export type RecruitFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const RECRUIT_INITIAL_STATE: RecruitFormState = { status: 'idle' }
