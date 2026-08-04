export type IntroFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const INTRO_INITIAL_STATE: IntroFormState = { status: 'idle' }
