import { supabaseService } from '@/lib/supabase/service'
import { formatKstDateTime } from '@/lib/utils/format-date'
import {
  getApplications,
  getCurrentRecruitRound,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type Application,
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

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>접수</Th>
            <Th>이름</Th>
            <Th>연락처</Th>
            <Th>이메일</Th>
            <Th>지원서</Th>
            <Th>사업계획서</Th>
            <Th>작업물</Th>
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
              <Td colSpan={10}>
                <p className="py-12 text-center text-fg-muted">
                  아직 지원자가 없습니다.
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
      RECRUIT · APPLICATIONS
    </p>
  )
}

function FileLink({
  path,
  urls,
  label,
}: {
  path: string | null
  urls: Map<string, string>
  label: string
}) {
  if (!path) return <>-</>
  const url = urls.get(path)
  if (!url) return <>-</>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-fg-primary"
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
    <tr className="border-b border-border align-top">
      <Td>{formatKstDateTime(app.created_at)}</Td>
      <Td>{app.name}</Td>
      <Td>{app.phone}</Td>
      <Td>{app.email}</Td>
      <Td>
        <FileLink path={app.file_path} urls={urls} label="PDF" />
      </Td>
      <Td>
        <FileLink path={app.business_plan_path} urls={urls} label="열기" />
      </Td>
      <Td>
        <FileLink path={app.portfolio_path} urls={urls} label="ZIP" />
      </Td>
      <Td>{app.remote_interview_reason ?? '-'}</Td>
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
