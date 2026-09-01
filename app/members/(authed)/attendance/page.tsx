import { getMemberByEmail, getPortalIdentity } from '@/lib/portal/auth'
import {
  ATTENDANCE_STATUS_LABELS,
  getAttendanceForMember,
  getSessions,
  summarizeAttendance,
  type AttendanceRow,
  type ClubSession,
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
    getSessions({ cohort: member.cohort, publishedOnly: true }),
  ])
  // 공개 세션을 기준으로 좌측 조인한다. 출결이 아직 입력되지 않은 세션은
  // '미기록'으로 남고, 정렬은 세션 목록과 같은 기준(kind·sort_order·week)을
  // 그대로 물려받는다. 요약도 같은 집합의 기록만 세어야 상단 집계와 표가
  // 어긋나지 않는다.
  const rowBySession = new Map(rows.map((r) => [r.session_id, r]))
  const entries = sessions.map((s) => ({
    session: s,
    row: rowBySession.get(s.id),
  }))
  const summary = summarizeAttendance(
    entries
      .map((e) => e.row)
      .filter((r): r is AttendanceRow => r !== undefined),
  )

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
              ? 'text-red-400'
              : 'text-fg-primary'
          }
        >
          {summary.convertedAbsences}회
        </strong>
        {' · '}회칙에 따라 지각 2회, 과제 미제출 3회는 결석 1회로 환산하며,
        환산 결석 3회 이상 시 제명 대상입니다.
      </p>

      {entries.length === 0 ? (
        <p className="mt-16 text-center font-display text-sm text-fg-muted">
          아직 공개된 세션이 없습니다.
        </p>
      ) : (
        <>
          {/* 모바일: 카드 리스트 (읽기 전용이라 제목·상태·비고만 쌓는다) */}
          <ul className="mt-8 flex flex-col gap-3 md:hidden">
            {entries.map(({ session, row }) => (
              <li key={session.id} className="border border-border p-4">
                <p className="font-display text-sm font-bold text-fg-primary">
                  {sessionTitle(session)}
                </p>
                <p className="mt-2 text-sm">
                  <Status row={row} />
                </p>
                {row?.note && (
                  <p className="mt-1 text-sm text-fg-subtle">{row.note}</p>
                )}
              </li>
            ))}
          </ul>

          {/* 데스크톱: 표 */}
          <div
            role="region"
            aria-label="출결 기록"
            tabIndex={0}
            className="mt-10 hidden overflow-x-auto md:block"
          >
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <Th>세션</Th>
                  <Th>출결</Th>
                  <Th>과제</Th>
                  <Th>비고</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map(({ session, row }) => (
                  <tr key={session.id} className="border-b border-border">
                    <Td>{sessionTitle(session)}</Td>
                    <Td>
                      {row ? (
                        ATTENDANCE_STATUS_LABELS[row.status]
                      ) : (
                        <span className="text-fg-muted">미기록</span>
                      )}
                    </Td>
                    <Td>{row?.assignment_missing ? '미제출' : '-'}</Td>
                    <Td>{row?.note ?? '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function sessionTitle(s: ClubSession) {
  return `${s.week !== null ? `${s.week}주차 · ` : ''}${s.title}`
}

/** 모바일 카드용 한 줄 상태. 과제 미제출은 열이 없으므로 상태 뒤에 붙인다. */
function Status({ row }: { row: AttendanceRow | undefined }) {
  if (!row) return <span className="text-fg-muted">미기록</span>
  return (
    <span className="text-fg-subtle">
      {ATTENDANCE_STATUS_LABELS[row.status]}
      {row.assignment_missing ? ' · 과제 미제출' : ''}
    </span>
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

/** 열 제목이 한글이라 uppercase는 무효고 0.32em 자간은 글자를 흩어놓는다. */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="font-mono text-[10px] text-fg-muted py-3 pr-4">{children}</th>
  )
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 pr-4 text-fg-subtle">{children}</td>
}
