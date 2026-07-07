import Link from 'next/link'
import type { Route } from 'next'
import { getSponsors } from '@/lib/sponsors/queries'

export const dynamic = 'force-dynamic'

const CATEGORY_LABEL: Record<string, string> = {
  prize: '데모데이 상금',
  operations: '운영자금',
}
const KIND_LABEL: Record<string, string> = {
  individual: '개인',
  company: '기업',
}

export default async function AdminSponsorsPage() {
  const sponsors = await getSponsors()
  return (
    <div>
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        HALL OF HONOR
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">후원자 명단</h1>
      <p className="mt-2 text-sm text-fg-subtle">
        <Link
          href={'/admin/sponsors/new' as Route}
          className="underline"
        >
          + 후원자 추가
        </Link>
      </p>

      <section className="mt-10 max-w-5xl border border-border">
        <div className="grid grid-cols-12 gap-x-4 border-b border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          <span className="col-span-3">이름</span>
          <span className="col-span-2">종류</span>
          <span className="col-span-2">카테고리</span>
          <span className="col-span-3">회차 라벨</span>
          <span className="col-span-1">순서</span>
          <span className="col-span-1 text-right">편집</span>
        </div>
        {sponsors.length === 0 ? (
          <p className="px-4 py-6 text-sm text-fg-muted">아직 등록된 후원자가 없습니다.</p>
        ) : (
          sponsors.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-12 items-center gap-x-4 border-b border-border px-4 py-3 text-sm text-fg-primary last:border-b-0"
            >
              <span className="col-span-3 font-display font-bold tracking-tight">
                {s.name}
              </span>
              <span
                translate="no"
                className="col-span-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-subtle"
              >
                {KIND_LABEL[s.kind]}
              </span>
              <span
                translate="no"
                className="col-span-2 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-subtle"
              >
                {CATEGORY_LABEL[s.category]}
              </span>
              <span className="col-span-3 text-xs text-fg-subtle">
                {s.cohort_label ?? '—'}
              </span>
              <span className="col-span-1 font-mono text-xs text-fg-muted">
                {s.order_index}
              </span>
              <span className="col-span-1 text-right">
                <Link
                  href={`/admin/sponsors/${s.id}` as Route}
                  className="font-mono text-[10px] uppercase tracking-[0.28em] underline"
                >
                  편집
                </Link>
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
