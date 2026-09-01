import { requireExec } from '@/lib/portal/auth'
import { getSiteConfig } from '@/lib/data/site-config'
import { getNotices } from '@/lib/portal/queries'
import { createNotice } from '@/app/members/actions/portal'
import { PortalSubmitButton } from '@/components/portal/submit-button'
import { DeleteButton } from '@/components/admin/delete-button'
import { formatKstDateTime } from '@/lib/utils/format-date'

export const dynamic = 'force-dynamic'

// 모바일에서 16px 미만이면 iOS가 포커스 시 화면을 확대한다. 데스크톱 밀도는 md 분기로 유지.
const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm'

export default async function ManageNoticesPage() {
  await requireExec()
  const siteConfig = await getSiteConfig()
  const notices = await getNotices(siteConfig.cohort)

  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MANAGE · NOTICES
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">
        Vol.{siteConfig.cohort} 공지 관리
      </h1>

      <form
        action={createNotice}
        className="mt-8 grid max-w-2xl grid-cols-1 gap-4 border border-border p-6"
      >
        <input type="hidden" name="cohort" value={siteConfig.cohort} />
        <input
          type="text"
          name="title"
          required
          maxLength={200}
          placeholder="공지 제목"
          className={INPUT_CLASS}
        />
        <textarea
          name="content_md"
          rows={4}
          placeholder="내용 (선택)"
          className={INPUT_CLASS}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 font-display text-sm text-fg-subtle">
            <input
              type="checkbox"
              name="pinned"
              className="h-4 w-4 border-border accent-fg-primary"
            />
            상단 고정
          </label>
          <PortalSubmitButton
            label="공지 올리기"
            pendingLabel="올리는 중…"
            className="border border-fg-primary px-5 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
          />
        </div>
      </form>

      <ul className="mt-10 divide-y divide-border border border-border">
        {notices.map((n) => (
          <li key={n.id} className="flex items-start gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                {n.pinned && (
                  <span
                    translate="no"
                    className="font-mono text-[10px] uppercase tracking-[0.24em] text-fg-primary"
                  >
                    PIN
                  </span>
                )}
                <span className="font-display text-sm font-bold text-fg-primary">
                  {n.title}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-fg-muted">
                  {formatKstDateTime(n.created_at).slice(0, 10)}
                </span>
              </div>
              {n.content_md && (
                <p className="mt-1 whitespace-pre-wrap font-display text-sm text-fg-subtle">
                  {n.content_md}
                </p>
              )}
            </div>
            <DeleteButton kind="notice" id={n.id} label={`${n.title} 공지`} />
          </li>
        ))}
        {notices.length === 0 && (
          <li className="p-12 text-center font-display text-sm text-fg-muted">
            등록된 공지가 없습니다.
          </li>
        )}
      </ul>
    </div>
  )
}
