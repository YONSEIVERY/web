export type DemodayActionState =
  | { status: 'idle' }
  | { status: 'success'; message?: string }
  | { status: 'error'; message: string }

export const DEMODAY_ACTION_INITIAL: DemodayActionState = { status: 'idle' }
