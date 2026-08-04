export type SendResultsState = {
  ok: boolean | null
  message: string | null
}

export const SEND_RESULTS_INITIAL_STATE: SendResultsState = {
  ok: null,
  message: null,
}
