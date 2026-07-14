export type PartnerActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export const PARTNER_ACTION_INITIAL: PartnerActionState = { status: 'idle' }
