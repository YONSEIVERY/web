export type InquiryFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const INITIAL_STATE: InquiryFormState = { status: 'idle' }
