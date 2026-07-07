export type SponsorActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export const SPONSOR_ACTION_INITIAL: SponsorActionState = { status: 'idle' }
