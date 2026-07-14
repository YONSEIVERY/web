export type LeadershipActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export const LEADERSHIP_ACTION_INITIAL: LeadershipActionState = { status: 'idle' }
