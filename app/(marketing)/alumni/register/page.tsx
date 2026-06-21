import type { Metadata } from 'next'
import { AlumniRegistrationForm } from '@/components/forms/alumni-registration-form'

export const metadata: Metadata = {
  title: '알럼나이 등록 — VERY',
}

export default function RegisterPage() {
  return (
    <main className="px-6 md:px-10 py-24 md:py-32">
      <div className="mx-auto max-w-2xl">
        <p
          translate="no"
          className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs"
        >
          ALUMNI · REGISTER
        </p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl text-fg-primary">
          알럼나이 등록
        </h1>
        <p className="mt-4 font-display text-base text-fg-subtle">
          VERY를 거쳐간 사람이라면 누구든 — 본인 정보와 (있다면) 회사도 함께
          알려주세요. 회장단 승인 후 공개됩니다.
        </p>
        <div className="mt-12">
          <AlumniRegistrationForm />
        </div>
      </div>
    </main>
  )
}
