import { PortalSubmitButton } from '@/components/portal/submit-button'
import {
  POST_SCOPES,
  POST_SCOPE_LABELS,
  SESSION_KINDS,
  SESSION_KIND_LABELS,
  type ClubSession,
} from '@/lib/portal/queries'
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
            {SESSION_KINDS.map((k) => (
              <option key={k} value={k}>
                {SESSION_KIND_LABELS[k]}
              </option>
            ))}
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

      <fieldset className="grid grid-cols-1 gap-4 border border-border p-5">
        <legend className={`${LABEL_CLASS} px-2`}>학회원 기록 · 과제</legend>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="allow_posts"
            defaultChecked={session?.allow_posts ?? false}
            className="h-4 w-4 border-border accent-fg-primary"
          />
          <span className="font-display text-sm text-fg-subtle">
            기록 허용 (글·사진·파일. 글로 내는 과제는 여기로 받습니다)
          </span>
        </label>

        {/* 비정규 세션 세 종류의 설정을 한 줄로 적어 둔다. 매번 어떻게
            맞추는지 되묻지 않게 하는 것이 이 안내의 목적이다. */}
        <p className="border border-border px-4 py-3 font-display text-xs leading-relaxed text-fg-muted">
          인사이트: 개인만 · 1건<br />
          스터디: 조와 개인 둘 다 · 1건 · 조 목록 입력<br />
          컨벤션: 개인만 · 2건 · 마감은 기수 말로
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className={LABEL_CLASS}>제출 단위</span>
            <select
              name="post_scope"
              defaultValue={session?.post_scope ?? 'individual'}
              className={INPUT_CLASS}
            >
              {POST_SCOPES.map((s) => (
                <option key={s} value={s}>
                  {POST_SCOPE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className={LABEL_CLASS}>인당 건수</span>
            <input
              type="number"
              name="post_quota"
              min={1}
              max={20}
              defaultValue={session?.post_quota ?? 1}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>조 목록 (조 단위로 받을 때만)</span>
          <input
            type="text"
            name="post_teams"
            defaultValue={(session?.post_teams ?? []).join(', ')}
            placeholder="1조, 2조, 3조, 4조"
            className={INPUT_CLASS}
          />
          <span className="font-display text-xs text-fg-muted">
            쉼표로 구분합니다. 학회원은 여기 적은 목록에서 고릅니다.
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>마감 (선택 · KST)</span>
          <input
            type="datetime-local"
            name="post_due"
            defaultValue={
              session?.post_due
                ? formatKstDatetimeLocal(session.post_due)
                : ''
            }
            className={INPUT_CLASS}
          />
          <span className="font-display text-xs text-fg-muted">
            비우면 마감 없이 계속 받습니다. 지나면 새 기록이 막히고,
            임원진 화면에 미제출자 명단이 뜹니다.
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>제출 안내 (선택)</span>
          <textarea
            name="post_note"
            rows={3}
            maxLength={1000}
            defaultValue={session?.post_note ?? ''}
            placeholder={
              '예: 조 제출에는 인증샷, 책 내용정리, 토론 녹음본, 토론 정리를 함께 올려주세요. 개인 제출에는 후기와 배운 점을 적어주세요.'
            }
            className={INPUT_CLASS}
          />
        </label>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 border border-border p-5">
        <legend className={`${LABEL_CLASS} px-2`}>발표자료 제출</legend>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="allow_submissions"
            defaultChecked={session?.allow_submissions ?? false}
            className="h-4 w-4 border-border accent-fg-primary"
          />
          <span className="font-display text-sm text-fg-subtle">
            제출 받기 (켜면 세션 화면에 제출 칸이 열립니다)
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>마감 (선택 · KST)</span>
          <input
            type="datetime-local"
            name="submission_due"
            defaultValue={
              session?.submission_due
                ? formatKstDatetimeLocal(session.submission_due)
                : ''
            }
            className={INPUT_CLASS}
          />
          <span className="font-display text-xs text-fg-muted">
            비우면 마감 없이 계속 받습니다. 지나면 새 제출이 막힙니다.
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>제출 안내 (선택)</span>
          <textarea
            name="submission_note"
            rows={3}
            maxLength={1000}
            defaultValue={session?.submission_note ?? ''}
            placeholder={'예: 조별 1개만 제출. 파일명은 "3조_중간발표"로.'}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="submissions_visible"
            defaultChecked={session?.submissions_visible ?? false}
            className="h-4 w-4 border-border accent-fg-primary"
          />
          <span className="font-display text-sm text-fg-subtle">
            학회원 상호 공개 (꺼두면 임원진과 제출 본인에게만 보입니다)
          </span>
        </label>
      </fieldset>

      <PortalSubmitButton
        label={submitLabel}
        className="inline-flex w-fit items-center gap-3 border border-fg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-fg-primary transition-colors hover:bg-fg-primary hover:text-bg-base"
        withArrow
      />
    </form>
  )
}
