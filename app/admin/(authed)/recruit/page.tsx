import { supabaseService } from '@/lib/supabase/service'
import { formatKstDateTime } from '@/lib/utils/format-date'
import {
  getApplications,
  getCurrentRecruitRound,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type Application,
  type ApplicationStatus,
} from '@/lib/recruit/queries'
import {
  setApplicationStatus,
  toggleRecruitOpen,
} from '@/app/admin/actions/recruit'
import { DeleteButton } from '@/components/admin/delete-button'

export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL_SEC = 60 * 60 // 1시간. 페이지를 새로고침하면 재발급된다.

export default async function AdminRecruitPage() {
  const round = await getCurrentRecruitRound()

  if (!round) {
    return (
      <div>
        <Header />
        <p className="mt-10 text-fg-muted">
          현재 라운드가 없습니다. Supabase에서 recruit_rounds에 행을 추가하세요.
        </p>
      </div>
    )
  }

  const applications = await getApplications(round.id)
  // 서명 URL은 3종 첨부 전체를 배치 한 번으로 발급한다.
  const urlByPath = new Map<string, string>()
  const allPaths = applications.flatMap((a) =>
    [a.file_path, a.business_plan_path, a.portfolio_path].filter(
      (p): p is string => Boolean(p),
    ),
  )
  if (allPaths.length > 0) {
    const { data } = await supabaseService.storage
      .from('recruit-applications')
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SEC)
    if (data) {
      for (const d of data) {
        if (d.path && d.signedUrl) urlByPath.set(d.path, d.signedUrl)
      }
    }
  }

  const countByStatus = new Map<ApplicationStatus, number>()
  for (const a of applications) {
    countByStatus.set(a.status, (countByStatus.get(a.status) ?? 0) + 1)
  }

  return (
    <div>
      <Header />
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        Vol.{round.cohort} 지원자 · 총 {applications.length}명
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <span
          translate="no"
          className={`inline-flex items-center border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] ${
            round.apply_open
              ? 'border-green-600 text-green-600'
              : 'border-border text-fg-muted'
          }`}
        >
          {round.apply_open ? 'OPEN' : 'CLOSED'}
        </span>
        {round.apply_deadline && (
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted">
            마감 {formatKstDateTime(round.apply_deadline)}
          </span>
        )}
        <form action={toggleRecruitOpen}>
          <input type="hidden" name="round_id" value={round.id} />
          <input
            type="hidden"
            name="next"
            value={round.apply_open ? 'close' : 'open'}
          />
          <button
            type="submit"
            className="border border-fg-primary px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
          >
            {round.apply_open ? '접수 닫기' : '접수 열기'}
          </button>
        </form>
        <a
          href={`/admin/recruit/export.xlsx?round=${round.id}`}
          className="border border-border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-subtle transition-colors hover:border-fg-primary hover:text-fg-primary"
        >
          엑셀 다운로드
        </a>
      </div>

      {/* 상태별 집계. 심사 진행 상황을 한 줄에서 파악한다. */}
      {applications.length > 0 && (
        <dl className="mt-5 flex flex-wrap gap-px border border-border bg-border">
          {APPLICATION_STATUSES.map((s) => {
            const n = countByStatus.get(s) ?? 0
            return (
              <div
                key={s}
                className="flex items-baseline gap-2 bg-bg-base px-4 py-2"
              >
                <dt
                  className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                    n > 0 ? 'text-fg-primary' : 'text-fg-muted'
                  }`}
                >
                  {APPLICATION_STATUS_LABELS[s]}
                </dt>
                <dd
                  translate="no"
                  className={`font-display text-sm font-bold tabular-nums ${
                    n > 0 ? 'text-fg-primary' : 'text-fg-muted'
                  }`}
                >
                  {n}
                </dd>
              </div>
            )
          })}
        </dl>
      )}

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <Th>접수</Th>
              <Th>지원자</Th>
              <Th>첨부</Th>
              <Th>비대면 사유</Th>
              <Th>상태</Th>
              <Th>삭제</Th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <ApplicationRow key={a.id} app={a} urls={urlByPath} />
            ))}
            {applications.length === 0 && (
              <tr>
                <Td colSpan={6}>
                  <p className="py-12 text-center text-fg-muted">
                    아직 지원자가 없습니다.
                  </p>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Header() {
  return (
    <p
      translate="no"
      className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
    >
      RECRUIT · APPLICATIONS
    </p>
  )
}

/** 첨부 슬롯. 제출됨=밑줄 링크, 미제출=흐린 라벨(선택 항목임을 드러낸다). */
function FileSlot({
  path,
  urls,
  label,
}: {
  path: string | null
  urls: Map<string, string>
  label: string
}) {
  const url = path ? urls.get(path) : null
  if (!path || !url)
    return (
      <span className="text-fg-muted opacity-40" title="미제출">
        {label}
      </span>
    )
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4 hover:text-fg-primary"
    >
      {label}
    </a>
  )
}

function ApplicationRow({
  app,
  urls,
}: {
  app: Application
  urls: Map<string, string>
}) {
  return (
    <tr className="border-b border-border align-top transition-colors hover:bg-fg-primary/[0.03]">
      <Td>
        <span className="whitespace-nowrap font-mono text-xs text-fg-muted">
          {formatKstDateTime(app.created_at)}
        </span>
      </Td>
      <Td>
        <p className="font-display font-bold text-fg-primary">{app.name}</p>
        <p className="mt-1 font-mono text-xs text-fg-muted">{app.email}</p>
        <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-fg-muted">
          {app.phone}
        </p>
      </Td>
      <Td>
        <div className="flex items-baseline gap-4 whitespace-nowrap">
          <FileSlot path={app.file_path} urls={urls} label="지원서" />
          <FileSlot
            path={app.business_plan_path}
            urls={urls}
            label="계획서"
          />
          <FileSlot path={app.portfolio_path} urls={urls} label="작업물" />
        </div>
      </Td>
      <Td>
        {app.remote_interview_reason ? (
          <p
            className="max-w-[26ch] line-clamp-3 leading-relaxed"
            title={app.remote_interview_reason}
          >
            {app.remote_interview_reason}
          </p>
        ) : (
          '-'
        )}
      </Td>
      <Td>
        <form action={setApplicationStatus} className="flex items-center gap-2">
          <input type="hidden" name="application_id" value={app.id} />
          <select
            name="status"
            defaultValue={app.status}
            className="border border-border bg-bg-base px-2 py-1.5 text-xs text-fg-primary focus:border-fg-primary focus:outline-none"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {APPLICATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle transition-colors hover:border-fg-primary hover:text-fg-primary"
          >
            저장
          </button>
        </form>
      </Td>
      <Td>
        <DeleteButton
          kind="application"
          id={app.id}
          label={`${app.name} (${app.email})`}
        />
      </Td>
    </tr>
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
