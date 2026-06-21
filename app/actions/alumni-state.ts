export type AlumniFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const ALUMNI_INITIAL_STATE: AlumniFormState = { status: 'idle' }
