import { PortalSubmitButton } from '@/components/portal/submit-button'
import type { ClubSession } from '@/lib/portal/queries'
import { formatKstDatetimeLocal } from '@/lib/utils/format-date'

// 모바일에서 16px 미만이면 iOS가 포커스 시 화면을 확대한다. 데스크톱 밀도는 md 분기로 유지.
const INPUT_CLASS =
  'w-full border border-border bg-bg-base px-4 py-3 font-display text-base text-fg-primary placeholder:text-fg-muted focus:border-fg-primary focus:outline-none md:text-sm'
const LABEL_CLASS =
  'flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary'

/**
 * 세션 생성/편집 공용 폼 (RSC). action은 server action을 그대로 받는다.
 * 본문은 마크다운 - 노션에서 옮겨 붙여도 표(GFM)까지 렌더링된다.
 */
export function SessionForm({
  action,
  session,
  defaultCohort,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>
  session?: ClubSession
  defaultCohort: number
  submitLabel: string
}) {
  return (
    <form action={action} className="grid max-w-3xl grid-cols-1 gap-6">
      {session && <input type="hidden" name="id" value={session.id} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>기수</span>
          <input
            type="number"
            name="cohort"
            required
            min={1}
            max={100}
            defaultValue={session?.cohort ?? defaultCohort}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>유형</span>
          <select
            name="kind"
            defaultValue={session?.kind ?? 'regular'}
            className={INPUT_CLASS}
          >
            <option value="regular">정규 세션</option>
            <option value="special">비정규 세션</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>주차 (선택)</span>
          <input
            type="number"
            name="week"
            min={0}
            max={30}
            defaultValue={session?.week ?? ''}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>정렬</span>
          <input
            type="number"
            name="sort_order"
            defaultValue={session?.sort_order ?? 100}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>제목</span>
        <input
          type="text"
          name="title"
          required
          maxLength={200}
          defaultValue={session?.title ?? ''}
          placeholder="예: 1주차 - OT + 10만플 시작"
          className={INPUT_CLASS}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>연사 (선택)</span>
          <input
            type="text"
            name="speaker"
            maxLength={200}
            defaultValue={session?.speaker ?? ''}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>일시 (선택 · KST)</span>
          <input
            type="datetime-local"
            name="event_date"
            defaultValue={
              session?.event_date
                ? formatKstDatetimeLocal(session.event_date)
                : ''
            }
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>장소 (선택)</span>
          <input
            type="text"
            name="location"
            maxLength={200}
            defaultValue={session?.location ?? ''}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>장소 안내 (선택)</span>
          <input
            type="text"
            name="location_note"
            maxLength={300}
            defaultValue={session?.location_note ?? ''}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className={LABEL_CLASS}>본문 (마크다운)</span>
        <textarea
          name="content_md"
          rows={10}
          defaultValue={session?.content_md ?? ''}
          placeholder={'## 세션 개요\n\n| 시간 | 내용 |\n| --- | --- |\n| 19:00 | ... |'}
          className={`${INPUT_CLASS} min-h-[45dvh] font-mono leading-relaxed md:min-h-[36rem] md:text-xs`}
        />
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={session?.is_published ?? false}
          className="h-4 w-4 border-border accent-fg-primary"
        />
        <span className="font-display text-sm text-fg-subtle">
          공개 (체크 해제 시 임원진에게만 보이는 초안)
        </span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="allow_posts"
          defaultChecked={session?.allow_posts ?? false}
          className="h-4 w-4 border-border accent-fg-primary"
        />
        <span className="font-display text-sm text-fg-subtle">
          학회원 기록 허용 (사진·소감문 작성, 비정규 세션 권장)
        </span>
      </label>

      <PortalSubmitButton
        label={submitLabel}
        className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
        withArrow
      />
    </form>
  )
}
