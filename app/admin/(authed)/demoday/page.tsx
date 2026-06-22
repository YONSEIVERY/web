import Link from 'next/link'
import type { Route } from 'next'
import { getDemodayVolumes, getDemodayAttendeeCount } from '@/lib/demoday/queries'
import { CreateDemodayForm } from '@/components/admin/demoday/create-form'

export const dynamic = 'force-dynamic'

export default async function AdminDemodayPage() {
  const events = await getDemodayVolumes()
  const counts = await Promise.all(
    events.map((e) => getDemodayAttendeeCount(e.id)),
  )

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        DEMODAY
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">회차 관리</h1>
      <p className="mt-3 max-w-2xl text-sm text-fg-subtle">
        매학기 데모데이의 신청 폼·포스터·일정을 한 곳에서 관리합니다.
        한 시점에 하나의 회차만 <em>현재</em> 상태로 둘 수 있고, 신청은 그
        회차에 대해서만 받습니다.
      </p>

      <section className="mt-10 max-w-2xl border border-border p-6">
        <h2
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
        >
          NEW VOLUME
        </h2>
        <CreateDemodayForm />
      </section>

      <table className="mt-12 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>회차</Th>
            <Th>학기</Th>
            <Th>현재</Th>
            <Th>신청</Th>
            <Th>신청자</Th>
            <Th>편집</Th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, idx) => (
            <tr key={e.id} className="border-b border-border">
              <Td>
                <span className="font-display text-base text-fg-primary">
                  Vol.{e.volume}
                </span>
              </Td>
              <Td>{e.semester}</Td>
              <Td>
                {e.is_current ? (
                  <span className="text-accent">CURRENT</span>
                ) : (
                  <span className="text-fg-muted">—</span>
                )}
              </Td>
              <Td>
                {e.register_open ? (
                  <span className="text-green-700">OPEN</span>
                ) : (
                  <span className="text-fg-muted">CLOSED</span>
                )}
              </Td>
              <Td>
                <Link
                  href={`/admin/demoday/${e.id}/attendees` as Route}
                  className="underline hover:text-fg-primary"
                >
                  {counts[idx]}명
                </Link>
              </Td>
              <Td>
                <Link
                  href={`/admin/demoday/${e.id}` as Route}
                  className="underline hover:text-fg-primary"
                >
                  편집
                </Link>
              </Td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <Td colSpan={6}>
                <p className="py-12 text-center text-fg-muted">
                  아직 회차가 없습니다. 위에서 첫 회차를 생성하세요.
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
