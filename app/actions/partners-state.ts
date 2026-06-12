export type PartnerFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const PARTNER_INITIAL_STATE: PartnerFormState = { status: 'idle' }
