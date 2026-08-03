import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import {
  ATTENDANCE_STATUS_LABELS,
  getAttendanceForMember,
  getSessions,
  summarizeAttendance,
} from '@/lib/portal/queries'

export const dynamic = 'force-dynamic'

/**
 * 본인 출결 조회. 로그인 이메일 ↔ cohort_members 매칭으로 본인 행만 보여준다.
 * 회칙 환산(지각 2회=결석 1, 과제 미제출 3회=결석 1, 결석 3회 제명)도 표기.
 */
export default async function MyAttendancePage() {
  const identity = await getPortalIdentity()
  const member = identity ? await getMemberByEmail(identity.email) : null

  if (!member) {
    return (
      <div>
        <Header />
        <p className="mt-10 max-w-[52ch] font-display text-sm leading-relaxed text-fg-subtle">
          로그인 계정과 매칭되는 학회원 정보를 찾지 못했습니다. 학회원 명단에
          등록된 이메일과 로그인 이메일이 다른 경우이니, 임원진에게
          문의해주세요.
        </p>
      </div>
    )
  }

  const [rows, sessions] = await Promise.all([
    getAttendanceForMember(member.id),
    getSessions({ cohort: member.cohort, publishedOnly: false }),
  ])
  const sessionById = new Map(sessions.map((s) => [s.id, s]))
  const summary = summarizeAttendance(rows)
  const sorted = [...rows].sort((a, b) => {
    const wa = sessionById.get(a.session_id)?.week ?? 99
    const wb = sessionById.get(b.session_id)?.week ?? 99
    return wa - wb
  })

  return (
    <div>
      <Header />
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        {member.name} · Vol.{member.cohort}
      </h1>

      <dl className="mt-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="출석" value={summary.present} />
        <Stat label="지각" value={summary.late} />
        <Stat label="결석" value={summary.absent} />
        <Stat label="조퇴" value={summary.early_leave} />
        <Stat label="인정" value={summary.excused} />
        <Stat label="과제 미제출" value={summary.assignment_missing} />
      </dl>

      <p className="mt-6 max-w-[60ch] font-display text-sm leading-relaxed text-fg-subtle">
        환산 결석{' '}
        <strong
          className={
            summary.convertedAbsences >= 3
              ? 'text-red-600'
              : 'text-fg-primary'
          }
        >
          {summary.convertedAbsences}회
        </strong>
        {' · '}회칙에 따라 지각 2회, 과제 미제출 3회는 결석 1회로 환산하며,
        환산 결석 3회 이상 시 제명 대상입니다.
      </p>

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>세션</Th>
            <Th>출결</Th>
            <Th>과제</Th>
            <Th>비고</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const s = sessionById.get(r.session_id)
            return (
              <tr key={r.id} className="border-b border-border">
                <Td>
                  {s
                    ? `${s.week !== null ? `${s.week}주차 · ` : ''}${s.title}`
                    : '(삭제된 세션)'}
                </Td>
                <Td>{ATTENDANCE_STATUS_LABELS[r.status]}</Td>
                <Td>{r.assignment_missing ? '미제출' : '-'}</Td>
                <Td>{r.note ?? '-'}</Td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <Td colSpan={4}>
                <p className="py-12 text-center text-fg-muted">
                  아직 출결 기록이 없습니다.
                </p>
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Header() {
  return (
    <p
      translate="no"
      className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
    >
      MEMBERS · MY ATTENDANCE
    </p>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-base p-4">
      <dt className="font-display text-xs text-fg-muted">{label}</dt>
      <dd className="mt-1 font-display text-xl font-bold text-fg-primary">
        {value}
      </dd>
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
    <td colSpan={colSpan} className="py-3 pr-4 text-fg-subtle">
      {children}
    </td>
  )
}
