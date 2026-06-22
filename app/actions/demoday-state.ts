export type DemodayFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const DEMODAY_INITIAL_STATE: DemodayFormState = { status: 'idle' }
