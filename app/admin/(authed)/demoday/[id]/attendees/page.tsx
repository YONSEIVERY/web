import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import {
  getDemodayAttendees,
  getDemodayById,
} from '@/lib/demoday/queries'

export const dynamic = 'force-dynamic'

export default async function AdminDemodayAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [event, attendees] = await Promise.all([
    getDemodayById(id),
    getDemodayAttendees(id),
  ])
  if (!event) notFound()

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        DEMODAY · VOL.{event.volume} · ATTENDEES
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        신청자 명단 · 총 {attendees.length}명
      </h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link
          href={`/admin/demoday/${event.id}` as Route}
          className="underline"
        >
          ← 회차 편집
        </Link>
        <span className="mx-2">·</span>
        <a
          href={`/admin/demoday/${event.id}/attendees/export.csv`}
          className="underline"
        >
          CSV 내려받기
        </a>
      </p>

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>접수</Th>
            <Th>이름</Th>
            <Th>소속</Th>
            <Th>연락처</Th>
            <Th>이메일</Th>
            <Th>역할</Th>
            <Th>VERY 동문</Th>
            <Th>뒷풀이</Th>
            <Th>목적</Th>
            <Th>알게된 경로</Th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((a) => (
            <tr key={a.id} className="border-b border-border align-top">
              <Td>{formatCreated(a.created_at)}</Td>
              <Td>{a.name}</Td>
              <Td>{a.affiliation}</Td>
              <Td>{a.phone}</Td>
              <Td>{a.email}</Td>
              <Td>{a.role}</Td>
              <Td>
                {a.is_very_alumni
                  ? a.very_cohort
                    ? `${a.very_cohort}기`
                    : '예'
                  : '아니요'}
              </Td>
              <Td>
                {a.attend_afterparty == null
                  ? '—'
                  : a.attend_afterparty
                    ? '참석'
                    : '불참'}
              </Td>
              <Td>{a.purposes.join(', ')}</Td>
              <Td>{a.referral_sources.join(', ')}</Td>
            </tr>
          ))}
          {attendees.length === 0 && (
            <tr>
              <Td colSpan={10}>
                <p className="py-12 text-center text-fg-muted">
                  아직 신청자가 없습니다.
                </p>
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3 pr-4">
      {children}
    </th>
  )
}
function Td({
  children,
  colSpan,
}: {
  children: React.ReactNode
  colSpan?: number
}) {
  return (
    <td colSpan={colSpan} className="py-4 pr-4 text-fg-subtle">
      {children}
    </td>
  )
}

function formatCreated(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
