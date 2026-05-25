// Supabase CLI 연결 후 `npx supabase gen types typescript` 결과로 교체 예정.
// 그때까지 `any`로 두어 `.from('table')` 호출이 keyof never로 막히지 않도록 함.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any

