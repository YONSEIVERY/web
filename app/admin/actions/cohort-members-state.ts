export type CohortMemberActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export const COHORT_MEMBER_ACTION_INITIAL: CohortMemberActionState = {
  status: 'idle',
}
