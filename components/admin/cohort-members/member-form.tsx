'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createMember, updateMember } from '@/app/admin/actions/cohort-members'
import {
  COHORT_MEMBER_ACTION_INITIAL,
  type CohortMemberActionState,
} from '@/app/admin/actions/cohort-members-state'

type Initial = {
  id?: string
  cohort: number
  name: string
  mono_name: string
  role_tier: 'president' | 'vice_president' | 'officer' | 'member'
  role_label: string
  team: string
  college: string
  major: string
  status: string
  bio: string
  email: string
  phone: string
  student_id: string
  birth: string
  sort_order: number
  published: boolean
}

export function MemberForm({ initial }: { initial: Initial }) {
  const isEdit = Boolean(initial.id)
  const [state, action] = useActionState<CohortMemberActionState, FormData>(
    isEdit ? updateMember : createMember,
    COHORT_MEMBER_ACTION_INITIAL,
  )
  return (
    <form action={action} className="mt-6 grid max-w-2xl grid-cols-1 gap-6">
      {isEdit && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <Label required>기수</Label>
          <input
            type="number"
            name="cohort"
            required
            min={1}
            max={100}
            defaultValue={initial.cohort}
            className={INPUT}
          />
        </label>
        <label className="grid gap-1">
          <Label required>역할 구분</Label>
          <select name="role_tier" defaultValue={initial.role_tier} className={INPUT}>
            <option value="president">회장 (PRESIDENT)</option>
            <option value="vice_president">부회장 (VICE PRESIDENT)</option>
            <option value="officer">임원진 (OFFICER)</option>
            <option value="member">학회원 (MEMBER)</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <Label required>이름 (한글)</Label>
          <input
            type="text"
            name="name"
            required
            defaultValue={initial.name}
            className={INPUT}
          />
        </label>
        <label className="grid gap-1">
          <Label>이름 (영문, 예: HYUNWOO SHIN · 선택)</Label>
          <input
            type="text"
            name="mono_name"
            defaultValue={initial.mono_name}
            className={INPUT}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <Label>표시 직책 (예: 학회장, 기획부장/총무)</Label>
          <input
            type="text"
            name="role_label"
            defaultValue={initial.role_label}
            className={INPUT}
          />
        </label>
        <label className="grid gap-1">
          <Label>팀 (선택)</Label>
          <input type="text" name="team" defaultValue={initial.team} className={INPUT} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <Label>단과대학</Label>
          <input
            type="text"
            name="college"
            defaultValue={initial.college}
            className={INPUT}
          />
        </label>
        <label className="grid gap-1">
          <Label>학과</Label>
          <input
            type="text"
            name="major"
            defaultValue={initial.major}
            className={INPUT}
          />
        </label>
      </div>

      <label className="grid gap-1">
        <Label>재학 상태 (예: 재학 · 휴학)</Label>
        <input
          type="text"
          name="status"
          defaultValue={initial.status}
          className={INPUT}
        />
      </label>

      <label className="grid gap-1">
        <Label>한 줄 소개 (선택 · 공개)</Label>
        <textarea
          name="bio"
          rows={2}
          defaultValue={initial.bio}
          className={INPUT}
        />
      </label>

      <fieldset className="grid grid-cols-1 gap-6 border-t border-border pt-6">
        <legend className="-mt-9 mb-1 bg-bg-base px-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          비공개 · 어드민 전용
        </legend>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="grid gap-1">
            <Label>이메일</Label>
            <input
              type="email"
              name="email"
              defaultValue={initial.email}
              className={INPUT}
            />
          </label>
          <label className="grid gap-1">
            <Label>연락처</Label>
            <input
              type="tel"
              name="phone"
              defaultValue={initial.phone}
              className={INPUT}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="grid gap-1">
            <Label>학번</Label>
            <input
              type="text"
              name="student_id"
              defaultValue={initial.student_id}
              className={INPUT}
            />
          </label>
          <label className="grid gap-1">
            <Label>생년월일 (MMDD 등 자유 형식)</Label>
            <input
              type="text"
              name="birth"
              defaultValue={initial.birth}
              className={INPUT}
            />
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-1">
          <Label>정렬 순서 (작을수록 위)</Label>
          <input
            type="number"
            name="sort_order"
            defaultValue={initial.sort_order}
            step={10}
            className={INPUT}
          />
        </label>
        <label className="inline-flex items-center gap-3 self-end pb-2">
          <input
            type="checkbox"
            name="published"
            defaultChecked={initial.published}
            className="h-4 w-4"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
            공개 페이지에 노출
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Submit isEdit={isEdit} />
        {state.status === 'success' && (
          <span className="text-xs text-green-700">{state.message ?? '저장됨'}</span>
        )}
        {state.status === 'error' && (
          <span className="text-xs text-red-600">{state.message}</span>
        )}
      </div>
    </form>
  )
}

const INPUT =
  'w-full border border-border bg-bg-base px-3 py-2 text-sm text-fg-primary focus:border-fg-primary focus:outline-none'

function Label({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
      {children}
      {required && <span className="ml-1 text-accent">*</span>}
    </span>
  )
}

function Submit({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-fg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-primary hover:bg-fg-primary hover:text-bg-base disabled:opacity-50"
    >
      {pending ? '저장 중…' : isEdit ? '저장' : '추가'}
    </button>
  )
}
