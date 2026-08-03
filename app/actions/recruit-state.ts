export type RecruitFormValues = {
  name: string
  phone: string
  email: string
  remoteReason: string
}

export type RecruitFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string; values: RecruitFormValues }

export const RECRUIT_INITIAL_STATE: RecruitFormState = { status: 'idle' }
