const KST_FORMAT = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** ISO 시각을 한국시간 기준 `YYYY.MM.DD HH:mm`으로 포맷한다. 서버가 UTC여도 안전. */
export function formatKstDateTime(iso: string): string {
  const parts = Object.fromEntries(
    KST_FORMAT.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  )
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`
}
