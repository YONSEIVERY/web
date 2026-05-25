# Supabase Migration + Application Workflow — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (또는 superpowers:subagent-driven-development) to implement this plan task-by-task.

**Goal:** Notion 백엔드를 Supabase로 풀 전환하고, 알럼나이·파트너십·산학협력 신청 폼 + 임원진 admin 페이지를 한 PR로 출시한다.

**Architecture:** Supabase Postgres + Storage + Auth(Google OAuth + admins 화이트리스트) + Resend 이메일. 공개 페이지는 RSC + ISR(60초), 폼은 Server Actions, admin은 middleware로 보호된 별도 layout. 단일 PR 마이그레이션으로 중간 사고 방지.

**Tech Stack:** Next.js 16.2.6 App Router (Turbopack, typedRoutes, RSC, Server Actions), React 19.2.4 (useActionState, useFormStatus), TypeScript strict, Tailwind v4, `@supabase/supabase-js` + `@supabase/ssr`, `resend` + `@react-email/components`.

**참조:**
- 디자인 근거: `docs/plans/2026-05-24-supabase-migration-design.md`
- 코드 컨벤션: `docs/PROGRESS.md`, `AGENTS.md` (Next.js 16 docs `node_modules/next/dist/docs/` 확인 필수)

---

## 검증 방식 — 이 사이트의 TDD

이 프로젝트엔 단위 테스트 인프라가 없고(학회 사이트 규모상 YAGNI), 페이지·Server Action은 단위 테스트가 자연스럽지 않습니다. 대신 **각 task 끝에 다음 3종 검증**을 명시적으로 통과시킵니다.

1. **타입체크**: `npx tsc --noEmit` — 출력 없으면 통과
2. **빌드**: `npm run build` — Phase 끝에서만 (작은 변경마다 돌리면 느림)
3. **수동 종단 검증**: 폼 제출/admin 토글 같은 동작성 변경은 dev 서버에서 직접 클릭

테스트 인프라(vitest/playwright) 도입은 이 plan의 out of scope.

---

## Phase 1 — 인프라 셋업 (5 tasks)

### Task 1: Supabase 프로젝트 + Resend 계정 (사용자 작업)

> ⚠️ 이 task는 외부 SaaS 가입이라 사용자가 직접 수행합니다. Claude는 가이드만 제공하고 결과(URL/키)를 받아 다음 task로 진행.

**사용자 action items**

1. **Supabase**
   - https://supabase.com → Sign in (GitHub OAuth 권장)
   - "New project" → Name `very-yonseivery`, Region `Northeast Asia (Seoul) ap-northeast-2`, DB 비밀번호 임의 생성
   - 프로젝트 생성 후 **Settings → API**에서 다음 3개 복사:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트로 노출 금지)

2. **Resend**
   - https://resend.com → Sign in
   - **API Keys** → "Create API Key" → Permission `Sending access` → 복사: `RESEND_API_KEY`

3. **`.env.local`에 추가** (리포 루트):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   RESEND_API_KEY=re_...
   ```

4. **Vercel** Settings → Environment Variables: 위 4개를 Production + Preview에 모두 등록

**완료 신호:** 사용자가 "셋업 완료"라고 알려주면 다음 task로.

**Commit:** 없음 (외부 셋업).

---

### Task 2: Supabase 스키마 마이그레이션 SQL

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

**Step 1: 마이그레이션 디렉터리 생성 후 SQL 작성**

```sql
-- supabase/migrations/0001_initial_schema.sql

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- admins — 임원진 화이트리스트
-- ============================================================
create table public.admins (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- site_config — 단일 행
-- ============================================================
create table public.site_config (
  key text primary key,
  cohort int not null,
  year int not null,
  semester text not null check (semester in ('1학기','2학기')),
  since_year int not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- alumni — 알럼나이 개인
-- ============================================================
create table public.alumni (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cohort int not null check (cohort between 1 and 100),
  email text not null,
  job_title text not null,
  bio text not null,
  linkedin_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index alumni_status_idx on public.alumni(status);
create index alumni_published_idx on public.alumni(published) where published = true;

-- ============================================================
-- alumni_companies — 알럼나이 창업 회사
-- ============================================================
create table public.alumni_companies (
  id uuid primary key default uuid_generate_v4(),
  founder_alumni_id uuid references public.alumni(id) on delete set null,
  name text not null,
  logo_url text not null,
  one_liner text not null,
  stage text check (stage in ('idea','seed','seriesA','seriesB','growth','exit')),
  website_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index alumni_companies_status_idx on public.alumni_companies(status);
create index alumni_companies_founder_idx on public.alumni_companies(founder_alumni_id);

-- ============================================================
-- partners — 공식 파트너
-- ============================================================
create table public.partners (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in ('CORPORATE','CAPITAL','ACADEMIC')),
  one_liner text not null,
  logo_url text,
  sort_order int not null default 100,
  applicant_name text not null,
  applicant_email text not null,
  applicant_note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index partners_status_idx on public.partners(status);
create index partners_published_idx on public.partners(published, sort_order) where published = true;

-- ============================================================
-- inquiries — 일반·산학협력 통합 문의
-- ============================================================
create table public.inquiries (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('GENERAL','INDUSTRY')),
  name text not null,
  email text not null,
  affiliation text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','done')),
  created_at timestamptz not null default now()
);
create index inquiries_status_idx on public.inquiries(status, created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table public.admins enable row level security;
alter table public.site_config enable row level security;
alter table public.alumni enable row level security;
alter table public.alumni_companies enable row level security;
alter table public.partners enable row level security;
alter table public.inquiries enable row level security;

-- admins: anon은 직접 읽기 불가. service_role만 접근. (정책 없음 = 전부 deny under RLS)

-- site_config: public read
create policy "site_config public read" on public.site_config
  for select using (true);

-- alumni: 승인+공개만 read, anon insert는 status='pending' published=false 강제 (트리거로)
create policy "alumni public read" on public.alumni
  for select using (status = 'approved' and published = true);
create policy "alumni anon insert" on public.alumni
  for insert with check (status = 'pending' and published = false);

create policy "alumni_companies public read" on public.alumni_companies
  for select using (status = 'approved' and published = true);
create policy "alumni_companies anon insert" on public.alumni_companies
  for insert with check (status = 'pending' and published = false);

create policy "partners public read" on public.partners
  for select using (status = 'approved' and published = true);
create policy "partners anon insert" on public.partners
  for insert with check (status = 'pending' and published = false);

create policy "inquiries anon insert" on public.inquiries
  for insert with check (status = 'new');

-- ============================================================
-- Storage buckets (public read)
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('alumni-company-logos', 'alumni-company-logos', true),
         ('partner-logos', 'partner-logos', true)
  on conflict do nothing;

-- Storage RLS — anon upload, public read
create policy "alumni-company-logos public read" on storage.objects
  for select using (bucket_id = 'alumni-company-logos');
create policy "alumni-company-logos anon insert" on storage.objects
  for insert with check (bucket_id = 'alumni-company-logos');

create policy "partner-logos public read" on storage.objects
  for select using (bucket_id = 'partner-logos');
create policy "partner-logos anon insert" on storage.objects
  for insert with check (bucket_id = 'partner-logos');
```

**Step 2: Supabase SQL Editor에서 실행**

- Supabase 대시보드 → SQL Editor → 위 SQL 붙여넣기 → Run
- 또는 **Supabase MCP** 사용 시: `mcp__plugin_supabase_supabase__apply_migration` 으로 적용

**Step 3: 검증**

대시보드 → **Database → Tables**에서 6개 테이블이 보이는지, **Storage → Buckets**에서 2개 버킷이 보이는지 확인.

**Step 4: Commit**

```bash
git add supabase/migrations/0001_initial_schema.sql
git commit -m "feat(db): initial Supabase schema — 6 tables + 2 storage buckets + RLS"
```

---

### Task 3: 시드 데이터 (admins 첫 행 + site_config)

**Files:**
- Create: `supabase/seed.sql`

**Step 1: seed SQL 작성**

```sql
-- supabase/seed.sql
-- 학회 운영진 화이트리스트와 site_config 첫 행

insert into public.admins (email, name) values
  ('ricky7@yonsei.ac.kr', '회장')   -- 사용자 본인 (필요시 더 추가)
on conflict (email) do nothing;

insert into public.site_config (key, cohort, year, semester, since_year) values
  ('current', 43, 2026, '1학기', 1997)
on conflict (key) do nothing;
```

> 이메일·이름은 실제 임원진 명단에 맞춰 수정. 사용자 본인은 반드시 포함되어야 admin 로그인 가능.

**Step 2: SQL Editor에서 실행 또는 MCP 적용**

**Step 3: 검증**

```sql
select * from public.admins;
select * from public.site_config;
```

각각 1행 이상 확인.

**Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(db): seed admins whitelist + site_config row"
```

---

### Task 4: 의존성 설치 + Supabase 클라이언트

**Files:**
- Modify: `package.json` (자동)
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/service.ts`
- Create: `lib/supabase/types.ts`

**Step 1: 새 의존성 설치, Notion 의존성 제거**

```bash
npm uninstall @notionhq/client
npm install @supabase/supabase-js @supabase/ssr resend @react-email/components react-email
```

**Step 2: Supabase TypeScript 타입 생성 (선택, 권장)**

```bash
npx supabase login                                                    # 1회만
npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
```

`<project-id>`는 Supabase 대시보드 URL의 `app.supabase.com/project/<여기>` 부분.

만약 CLI 셋업이 부담스러우면 **Supabase MCP**의 `mcp__plugin_supabase_supabase__generate_typescript_types` 사용. 둘 다 어려우면 `lib/supabase/types.ts`는 `export type Database = unknown` 임시로 두고 나중에.

**Step 3: 서버용 클라이언트** — `lib/supabase/server.ts`

```typescript
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Server Components와 Server Actions에서 사용하는 Supabase 클라이언트.
 * RSC 요청별로 fresh 인스턴스를 만들어야 cookie가 정확히 전파됨.
 * anon key 사용 — RLS가 권한을 관리.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 set 호출 시 무시 (RSC 제약)
          }
        },
      },
    }
  )
}
```

**Step 4: 브라우저용 클라이언트** — `lib/supabase/browser.ts`

```typescript
'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 5: service_role 클라이언트 (admin 전용)** — `lib/supabase/service.ts`

```typescript
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * RLS를 우회하는 service_role 클라이언트.
 * admin Server Action에서만 사용 — 미들웨어가 사전에 권한 검증 완료.
 * 다른 모듈에서 절대 import 금지.
 */
export const supabaseService = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
```

**Step 6: 타입체크**

```bash
npx tsc --noEmit
```

Expected: 출력 없음.

**Step 7: Commit**

```bash
git add package.json package-lock.json lib/supabase/
git commit -m "feat(supabase): add SSR + service clients, remove notion dep"
```

---

### Task 5: Email 인프라 + 템플릿 3종

**Files:**
- Create: `lib/email/client.ts`
- Create: `lib/email/notifications.ts`
- Create: `emails/inquiry-notification.tsx`
- Create: `emails/partner-application-notification.tsx`
- Create: `emails/alumni-registration-notification.tsx`

**Step 1: Resend 클라이언트** — `lib/email/client.ts`

```typescript
import 'server-only'
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const NOTIFY_TO = 'yonseivery1997@gmail.com'
export const NOTIFY_FROM = 'VERY 사이트 <noreply@send.resend.dev>'
//                          ↑ Phase 1.5에서 yonseivery.com으로 교체
```

**Step 2: 공통 발송 헬퍼** — `lib/email/notifications.ts`

```typescript
import 'server-only'
import { resend, NOTIFY_TO, NOTIFY_FROM } from './client'
import InquiryNotification from '@/emails/inquiry-notification'
import PartnerApplicationNotification from '@/emails/partner-application-notification'
import AlumniRegistrationNotification from '@/emails/alumni-registration-notification'

export async function sendInquiryNotification(args: {
  id: string
  type: 'GENERAL' | 'INDUSTRY'
  name: string
  email: string
  affiliation?: string | null
  subject: string
  message: string
}) {
  try {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `[VERY] 신규 ${args.type === 'INDUSTRY' ? '산학협력' : ''} 문의 — ${args.name}`,
      react: InquiryNotification(args),
    })
  } catch (e) {
    console.error('sendInquiryNotification failed', e)
  }
}

export async function sendPartnerApplicationNotification(args: {
  id: string
  name: string
  category: string
  one_liner: string
  applicant_name: string
  applicant_email: string
  applicant_note?: string | null
}) {
  try {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `[VERY] 신규 파트너십 신청 — ${args.name}`,
      react: PartnerApplicationNotification(args),
    })
  } catch (e) {
    console.error('sendPartnerApplicationNotification failed', e)
  }
}

export async function sendAlumniRegistrationNotification(args: {
  alumniId: string
  name: string
  cohort: number
  job_title: string
  bio: string
  hasCompany: boolean
  companyName?: string
}) {
  try {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: `[VERY] 신규 알럼나이 신청 — ${args.name} (${args.cohort}기)${args.hasCompany ? ' +회사' : ''}`,
      react: AlumniRegistrationNotification(args),
    })
  } catch (e) {
    console.error('sendAlumniRegistrationNotification failed', e)
  }
}
```

**Step 3: 템플릿 3종** — React Email 컴포넌트

`emails/inquiry-notification.tsx`:

```tsx
import { Html, Head, Body, Container, Heading, Text, Hr, Button, Section } from '@react-email/components'

interface Props {
  id: string
  type: 'GENERAL' | 'INDUSTRY'
  name: string
  email: string
  affiliation?: string | null
  subject: string
  message: string
}

export default function InquiryNotification(p: Props) {
  const adminUrl = `https://yonseivery.com/admin/inquiries?id=${p.id}`
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · 신규 {p.type === 'INDUSTRY' ? '산학협력 ' : ''}문의
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Row label="이름" value={p.name} />
            <Row label="이메일" value={p.email} />
            {p.affiliation && <Row label="소속/회사" value={p.affiliation} />}
            <Row label="분류" value={p.subject} />
          </Section>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Text style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.7 }}>{p.message}</Text>
          <Hr style={{ margin: '24px 0', borderColor: '#e7e5e4' }} />
          <Button
            href={adminUrl}
            style={{ background: 'black', color: 'white', padding: '12px 20px', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            ADMIN에서 처리하기 →
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: '4px 0', fontSize: '13px' }}>
      <span style={{ display: 'inline-block', width: '90px', color: '#78716c', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span>{value}</span>
    </Text>
  )
}
```

`emails/partner-application-notification.tsx` (같은 패턴):

```tsx
import { Html, Head, Body, Container, Heading, Text, Hr, Button, Section } from '@react-email/components'

interface Props {
  id: string
  name: string
  category: string
  one_liner: string
  applicant_name: string
  applicant_email: string
  applicant_note?: string | null
}

export default function PartnerApplicationNotification(p: Props) {
  const adminUrl = `https://yonseivery.com/admin/applications/partner/${p.id}`
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · 신규 파트너십 신청
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Row label="회사명" value={p.name} />
            <Row label="카테고리" value={p.category} />
            <Row label="신청자" value={`${p.applicant_name} (${p.applicant_email})`} />
          </Section>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Text style={{ fontSize: '14px', lineHeight: 1.7 }}>{p.one_liner}</Text>
          {p.applicant_note && (
            <>
              <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
              <Text style={{ fontSize: '13px', color: '#57534e', whiteSpace: 'pre-wrap' }}>{p.applicant_note}</Text>
            </>
          )}
          <Hr style={{ margin: '24px 0', borderColor: '#e7e5e4' }} />
          <Button
            href={adminUrl}
            style={{ background: 'black', color: 'white', padding: '12px 20px', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            ADMIN에서 처리하기 →
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: '4px 0', fontSize: '13px' }}>
      <span style={{ display: 'inline-block', width: '90px', color: '#78716c', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span>{value}</span>
    </Text>
  )
}
```

`emails/alumni-registration-notification.tsx` (같은 패턴):

```tsx
import { Html, Head, Body, Container, Heading, Text, Hr, Button, Section } from '@react-email/components'

interface Props {
  alumniId: string
  name: string
  cohort: number
  job_title: string
  bio: string
  hasCompany: boolean
  companyName?: string
}

export default function AlumniRegistrationNotification(p: Props) {
  const adminUrl = `https://yonseivery.com/admin/applications/alumni/${p.alumniId}`
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · 신규 알럼나이 신청
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Row label="이름" value={p.name} />
            <Row label="기수" value={`${p.cohort}기`} />
            <Row label="현재" value={p.job_title} />
            {p.hasCompany && <Row label="동반 회사" value={p.companyName ?? '—'} />}
          </Section>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Text style={{ fontSize: '14px', lineHeight: 1.7 }}>{p.bio}</Text>
          <Hr style={{ margin: '24px 0', borderColor: '#e7e5e4' }} />
          <Button
            href={adminUrl}
            style={{ background: 'black', color: 'white', padding: '12px 20px', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            ADMIN에서 처리하기 →
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: '4px 0', fontSize: '13px' }}>
      <span style={{ display: 'inline-block', width: '90px', color: '#78716c', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span>{value}</span>
    </Text>
  )
}
```

**Step 4: 타입체크**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add lib/email/ emails/
git commit -m "feat(email): add Resend client and 3 notification templates"
```

---

## Phase 2 — 공개 페이지 마이그레이션 (4 tasks)

### Task 6: 데이터 모듈 — site_config + partners

**Files:**
- Create: `lib/data/site-config.ts`
- Create: `lib/data/partners.ts`
- (Notion 모듈은 task 9에서 삭제)

**Step 1: `lib/data/site-config.ts`**

```typescript
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface SiteConfig {
  cohort: number
  year: number
  semester: '1학기' | '2학기'
  sinceYear: number
}

const FALLBACK: SiteConfig = {
  cohort: 43,
  year: 2026,
  semester: '1학기',
  sinceYear: 1997,
}

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_config')
      .select('cohort, year, semester, since_year')
      .eq('key', 'current')
      .maybeSingle()
    if (error || !data) return FALLBACK
    return {
      cohort: data.cohort,
      year: data.year,
      semester: data.semester as '1학기' | '2학기',
      sinceYear: data.since_year,
    }
  } catch {
    return FALLBACK
  }
})
```

**Step 2: `lib/data/partners.ts`**

```typescript
import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type PartnerCategory = 'CORPORATE' | 'CAPITAL' | 'ACADEMIC'

export interface Partner {
  id: string
  name: string
  category: PartnerCategory
  oneLiner: string
  logoUrl: string | null
  sortOrder: number
}

export async function getPartners(): Promise<Partner[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('partners')
      .select('id, name, category, one_liner, logo_url, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error || !data) return []
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as PartnerCategory,
      oneLiner: r.one_liner,
      logoUrl: r.logo_url,
      sortOrder: r.sort_order,
    }))
  } catch {
    return []
  }
}
```

> RLS가 `published=true AND status='approved'`만 노출하므로 클라이언트에서 필터 안 해도 안전.

**Step 3: 타입체크**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add lib/data/site-config.ts lib/data/partners.ts
git commit -m "feat(data): add Supabase-backed site_config and partners readers"
```

---

### Task 7: 데이터 모듈 — alumni (+ companies join)

**Files:**
- Create: `lib/data/alumni.ts`

**Step 1: `lib/data/alumni.ts`**

```typescript
import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type CompanyStage = 'idea' | 'seed' | 'seriesA' | 'seriesB' | 'growth' | 'exit'

export interface AlumniCompany {
  id: string
  founderAlumniId: string | null
  name: string
  logoUrl: string
  oneLiner: string
  stage: CompanyStage | null
  websiteUrl: string | null
}

export interface Alumni {
  id: string
  name: string
  cohort: number
  jobTitle: string
  bio: string
  linkedinUrl: string | null
  companies: AlumniCompany[]
}

export async function getAlumni(): Promise<Alumni[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('alumni')
      .select(`
        id, name, cohort, job_title, bio, linkedin_url,
        alumni_companies!alumni_companies_founder_alumni_id_fkey (
          id, founder_alumni_id, name, logo_url, one_liner, stage, website_url, status, published
        )
      `)
      .order('cohort', { ascending: false })
      .order('name', { ascending: true })
    if (error || !data) return []
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      cohort: r.cohort,
      jobTitle: r.job_title,
      bio: r.bio,
      linkedinUrl: r.linkedin_url,
      companies: (r.alumni_companies as Array<{
        id: string
        founder_alumni_id: string
        name: string
        logo_url: string
        one_liner: string
        stage: string | null
        website_url: string | null
        status: string
        published: boolean
      }>)
        .filter((c) => c.status === 'approved' && c.published)
        .map((c) => ({
          id: c.id,
          founderAlumniId: c.founder_alumni_id,
          name: c.name,
          logoUrl: c.logo_url,
          oneLiner: c.one_liner,
          stage: c.stage as CompanyStage | null,
          websiteUrl: c.website_url,
        })),
    }))
  } catch {
    return []
  }
}

export async function getAlumniCompanies(): Promise<AlumniCompany[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('alumni_companies')
      .select('id, founder_alumni_id, name, logo_url, one_liner, stage, website_url')
      .order('name', { ascending: true })
    if (error || !data) return []
    return data.map((c) => ({
      id: c.id,
      founderAlumniId: c.founder_alumni_id,
      name: c.name,
      logoUrl: c.logo_url,
      oneLiner: c.one_liner,
      stage: c.stage as CompanyStage | null,
      websiteUrl: c.website_url,
    }))
  } catch {
    return []
  }
}
```

> alumni → alumni_companies join은 inner Supabase join 문법. 자식의 RLS도 작동하므로 추가 필터링은 안전성 차원.

**Step 2: 타입체크 + Commit**

```bash
npx tsc --noEmit
git add lib/data/alumni.ts
git commit -m "feat(data): add alumni + alumni_companies join reader"
```

---

### Task 8: 호출부 교체 — footer, home, partners, alumni 페이지

> **Plan-실제 drift 보정 (2026-05-26)**: 원래 plan은 "호출부에 이미 `@/lib/server/site-config-cache` / `@/lib/content/partners`의 `getPartners`가 깔려 있고 import 한 줄만 바꾸면 된다"로 가정했으나, 실제 코드는 정적 const(`SITE`, `STATS`, `PARTNERS.roster.items`, `ALUMNI.spotlight.items`)를 직접 사용 중. 따라서 Task 8은 단순 import 교체가 아니라 **async server component 전환 + Supabase 데이터 wiring + 빈 배열 안내** 작업. `lib/content/{site,partners,alumni}.ts`는 정적 UI 콘텐츠로 그대로 유지 (Notion 의존 없음).

**Files:**
- Modify: `components/site/site-footer.tsx`
- Modify: `app/(marketing)/page.tsx`
- Modify: `app/(marketing)/partners/page.tsx`
- Modify: `app/(marketing)/alumni/page.tsx`

`lib/content/site.ts`, `lib/content/partners.ts`, `lib/content/alumni.ts`는 **수정 안 함** (정적 UI 카피·라벨 보유).

---

**Step 1: `components/site/site-footer.tsx`** — async 전환 + siteConfig wiring

`import { SITE } from '@/lib/content/site'` 유지. 상단에 추가:

```typescript
import { getSiteConfig } from '@/lib/data/site-config'
```

함수 시그니처 + 데이터 사용:

```typescript
// before
export function SiteFooter() {
  const startYear = SITE.since
  const endYear = new Date().getFullYear()
  // ...
  // VOL.{SITE.currentCohort} / {endYear}—1 · EST. {SITE.since}

// after
export async function SiteFooter() {
  const siteConfig = await getSiteConfig()
  const startYear = siteConfig.sinceYear
  const endYear = new Date().getFullYear()
  // ...
  // VOL.{siteConfig.cohort} / {endYear}—1 · EST. {siteConfig.sinceYear}
```

`SITE.email`, `SITE.instagram`은 그대로 유지.

---

**Step 2: `app/(marketing)/page.tsx`** — `HomePage` async 전환 + corner labels 동적화 + stats wiring

상단 import 추가:

```typescript
import { getSiteConfig } from '@/lib/data/site-config'
```

(a) `CORNER_LABELS`는 모듈 스코프 상수에서 `HomeHero` 내부 로컬로 이동 (siteConfig 의존). `HomeHero`를 async로:

```typescript
async function HomeHero() {
  const siteConfig = await getSiteConfig()
  const semesterDigit = siteConfig.semester === '1학기' ? '1' : '2'
  const cornerLabels: ReadonlyArray<{ slot: CornerSlot; text: string; accent: boolean; delayMs: number }> = [
    { slot: 'tl', text: `VOL.${siteConfig.cohort} / ${siteConfig.year}—${semesterDigit}`, accent: true, delayMs: 0 },
    { slot: 'tr', text: `EST. ${siteConfig.sinceYear}`, accent: false, delayMs: 100 },
    { slot: 'bl', text: 'YONSEI UNIVERSITY', accent: false, delayMs: 200 },
    { slot: 'br', text: 'SEOUL, KR', accent: false, delayMs: 300 },
  ]
  return (
    <section className="relative h-[100dvh] w-full overflow-hidden">
      {/* ... 기존 마크업, HeroCorners({ labels: cornerLabels }) 로 전달 ... */}
    </section>
  )
}
```

`HeroCorners` 시그니처는 prop 받도록 변경: `function HeroCorners({ labels }: { labels: ReadonlyArray<...> })`.

(b) `StatsSection`도 async로 + siteConfig wiring:

```typescript
async function StatsSection() {
  const siteConfig = await getSiteConfig()
  const cells = [
    { value: String(siteConfig.year - siteConfig.sinceYear), label: 'YEARS', caption: `${siteConfig.sinceYear}년부터 멈춘 적 없는 활동` },
    { value: String(siteConfig.cohort), label: 'COHORTS', caption: '학기마다 다진 한 묶음의 지반' },
    { value: `${STATS.alumniCount}+`, label: 'ALUMNI', caption: '누적 회원 네트워크' },
    { value: `${STATS.startupsCount}+`, label: 'STARTUPS', caption: '학회를 거쳐간 창업팀' },
  ]
  // ...
  // $ stats --vol={siteConfig.cohort}
```

(c) `HomePage`를 async로:

```typescript
export default async function HomePage() {
  return (
    <main>
      <HomeHero />
      <ManifestoSection />
      <StatsSection />
    </main>
  )
}
```

`HomeHero`/`StatsSection`이 async RSC라 `await` 없이 직접 JSX에 두면 React 19에서 정상 동작. `lib/content/site.ts`의 `STATS.alumniCount`, `STATS.startupsCount`는 그대로 사용. `STATS.yearsActive`, `STATS.cohorts`는 더 이상 안 씀 (siteConfig 파생값이 대체).

---

**Step 3: `app/(marketing)/partners/page.tsx`** — items만 DB로 교체

`import { PARTNERS } from '@/lib/content/partners'` 유지 (섹션 라벨·타이틀·카피 정적). 상단에 추가:

```typescript
import { getPartners } from '@/lib/data/partners'
```

(a) `PartnersPage`를 async로 + roster 데이터 prefetch + `RosterSection`에 prop 전달:

```typescript
export default async function PartnersPage() {
  const roster = await getPartners()
  return (
    <main className="pt-14 md:pt-16">
      <PartnersHero />
      <IntroSection />
      <CategoriesSection />
      <RosterSection roster={roster} />
      <EngageSection />
      <ClosingSection />
    </main>
  )
}
```

(b) `RosterSection`을 prop 받게 + items 매핑 변경 + 빈 배열 안내:

```typescript
import type { Partner } from '@/lib/data/partners'

function RosterSection({ roster }: { roster: Partner[] }) {
  const { label, title, note } = PARTNERS.roster
  return (
    <section /* ... */>
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 /* ... */>{title}</h2>
        <p /* ... */>{note}</p>
        {roster.length === 0 ? (
          <p className="about-anim-body mt-12 border-t border-border pt-10 text-sm leading-[1.7] text-fg-muted md:text-base">
            곧 공개됩니다.
          </p>
        ) : (
          <ul className="about-anim-meta mt-12 flex flex-col border-t border-border">
            {roster.map((partner) => (
              <li key={partner.id} className="grid grid-cols-12 items-baseline gap-x-4 border-b border-border py-6 md:gap-x-8 md:py-8">
                <span /* mono category */>{partner.category}</span>
                <span /* name */>{partner.name}</span>
                <p /* oneLiner */>{partner.oneLiner}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
```

기존 `items.map((item, i) => ...)`을 `roster.map((partner) => ...)`로 교체. key는 `partner.id`. `item.note` → `partner.oneLiner`.

---

**Step 4: `app/(marketing)/alumni/page.tsx`** — spotlight를 companies로 교체

`import { ALUMNI } from '@/lib/content/alumni'` 유지 (섹션 라벨·hero·intro 등). 상단에 추가:

```typescript
import { getAlumniCompanies } from '@/lib/data/alumni'
import type { AlumniCompany } from '@/lib/data/alumni'
```

(a) `AlumniPage`를 async로 + companies prefetch + `SpotlightSection`에 prop 전달:

```typescript
export default async function AlumniPage() {
  const companies = await getAlumniCompanies()
  return (
    <main className="pt-14 md:pt-16">
      <AlumniHero />
      <IntroSection />
      <StatsSection />
      <SpotlightSection companies={companies} />
      <PathwaysSection />
      <ClosingSection />
    </main>
  )
}
```

(b) `SpotlightSection`을 prop 받게 + 카드 매핑 변경 + cohort/year 제거 + 빈 배열 안내:

```typescript
function SpotlightSection({ companies }: { companies: AlumniCompany[] }) {
  const { label, title, note } = ALUMNI.spotlight
  return (
    <section /* ... */>
      <SectionLabel label={label} className="col-span-12 md:col-span-3" />
      <div className="col-span-12 mt-6 md:col-span-8 md:col-start-5 md:mt-0">
        <h2 /* ... */>{title}</h2>
        <p /* ... */>{note}</p>
        {companies.length === 0 ? (
          <p className="about-anim-body mt-12 border-t border-border pt-10 text-sm leading-[1.7] text-fg-muted md:text-base">
            곧 공개됩니다.
          </p>
        ) : (
          <ul className="about-anim-meta mt-12 grid grid-cols-1 gap-px overflow-hidden border-t border-border bg-border md:grid-cols-2 md:border md:border-border">
            {companies.map((company) => (
              <li key={company.id} className="bg-bg-base">
                <div className="flex h-full flex-col gap-4 px-6 py-8 md:px-8 md:py-10">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl">
                      {company.name}
                    </p>
                    {company.stage && (
                      <span translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent md:text-xs">
                        {company.stage}
                      </span>
                    )}
                  </div>
                  <p className="max-w-[42ch] text-sm leading-[1.7] text-fg-subtle md:text-base">
                    {company.oneLiner}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
```

기존 `cohort/year` 칸은 카드에서 완전히 제거. `company.stage`는 null 가능하므로 truthy 가드. `company.logoUrl`은 이번 task에서 미사용 (추후 별도 task로 이미지 통합 가능).

---

**Step 5: 타입체크**

```bash
npx tsc --noEmit
```

자주 깨지는 곳:
- `verbatimModuleSyntax: true` — `Partner`, `AlumniCompany`는 반드시 `import type { ... }`.
- async function이 React 16 typedRoutes 트랩 — `Promise<JSX.Element>` 반환은 RSC에서 정상이지만 `'use client'` 컴포넌트와 섞이지 않게 주의 (이번 4파일 모두 server component).

**Step 6: Commit**

```bash
git add components/site/site-footer.tsx "app/(marketing)/page.tsx" "app/(marketing)/partners/page.tsx" "app/(marketing)/alumni/page.tsx"
git commit -m "feat(pages): wire Supabase data into footer, home, partners, alumni"
```

---

### Task 9: ~~Notion 코드·문서 폐기~~ — **폐기됨 (2026-05-26)**

> **폐기 사유**: plan 작성 당시엔 "사이트가 Notion 백엔드에 의존 중"으로 가정했으나, 실제 코드를 grep해보니 `@/lib/notion`이나 `@/lib/server/site-config-cache`를 import하는 호출 사이트가 **없음**. `lib/content/partners.ts`도 정적 UI 콘텐츠일 뿐 Notion 의존 없음. `docs/notion-setup.md`도 존재하지 않음. 따라서 본 task의 "삭제" 단계는 거의 no-op.
>
> **남은 정리**: `lib/notion/parsers/.gitkeep` 한 파일만 잔존 (옛 디렉터리 placeholder). 이건 별도 task 없이 Task 8 commit과 분리해서 처리.

**Step 1: 잔존 빈 디렉터리 정리**

```bash
rm lib/notion/parsers/.gitkeep
rmdir lib/notion/parsers 2>/dev/null
rmdir lib/notion 2>/dev/null
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: drop empty lib/notion placeholder dir"
```

**Step 3**: 본 task는 여기서 종료. `lib/content/site.ts`, `lib/content/partners.ts`, `lib/content/alumni.ts`는 모두 **유지** (정적 UI 콘텐츠).

---

## Phase 3 — 폼 + Server Actions (5 tasks)

### Task 10: 일반·산학협력 문의 Server Action

**Files:**
- Modify (재작성): `app/actions/inquiries.ts`

**Step 1: 재작성**

```typescript
'use server'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendInquiryNotification } from '@/lib/email/notifications'
import { headers } from 'next/headers'

// NOTE: anon `createClient()` would bypass-fail here — `inquiries` has no SELECT
// policy, so `.insert().select('id').single()` returns 0 rows via RLS-filtered
// RETURNING. Use `supabaseService` (service_role) to skip RLS. Defaults still
// enforce `status='new'`, and `.insert({...})` hardcodes the field list.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type InquiryFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

const INITIAL: InquiryFormState = { status: 'idle' }
export const INITIAL_STATE: InquiryFormState = INITIAL

async function clientKey() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

export async function submitContactInquiry(
  _prev: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  // Honeypot
  if (formData.get('website')) return { status: 'success' }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const affiliation = String(formData.get('affiliation') ?? '').trim() || null
  const subject = String(formData.get('subject') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!name || name.length > 80) return { status: 'error', message: '이름을 확인해주세요.' }
  if (!EMAIL_RE.test(email)) return { status: 'error', message: '이메일 형식을 확인해주세요.' }
  if (!['RECRUIT', 'PARTNERSHIP', 'PRESS', 'OTHER'].includes(subject))
    return { status: 'error', message: '용건을 선택해주세요.' }
  if (message.length < 10 || message.length > 2000)
    return { status: 'error', message: '메시지는 10–2000자 사이로 작성해주세요.' }

  const rl = checkRateLimit(`contact:${await clientKey()}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.ok) return { status: 'error', message: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)` }

  const { data, error } = await supabaseService
    .from('inquiries')
    .insert({ type: 'GENERAL', name, email, affiliation, subject, message })
    .select('id')
    .single()
  if (error || !data) return { status: 'error', message: '저장에 실패했습니다.' }

  await sendInquiryNotification({
    id: data.id,
    type: 'GENERAL',
    name, email, affiliation, subject, message,
  })

  return { status: 'success' }
}

export async function submitIndustryInquiry(
  _prev: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  if (formData.get('website')) return { status: 'success' }

  const affiliation = String(formData.get('company') ?? '').trim()   // 회사명
  const name = String(formData.get('name') ?? '').trim()             // 담당자
  const email = String(formData.get('email') ?? '').trim()
  const subject = String(formData.get('subject') ?? '').trim()       // 분류 select
  const message = String(formData.get('message') ?? '').trim()

  if (!affiliation || affiliation.length > 120) return { status: 'error', message: '회사명을 확인해주세요.' }
  if (!name || name.length > 80) return { status: 'error', message: '담당자명을 확인해주세요.' }
  if (!EMAIL_RE.test(email)) return { status: 'error', message: '이메일 형식을 확인해주세요.' }
  if (!['멘토링', '세션 진행', '공동 프로젝트', '기타'].includes(subject))
    return { status: 'error', message: '문의 분류를 선택해주세요.' }
  if (message.length < 10 || message.length > 2000)
    return { status: 'error', message: '메시지는 10–2000자 사이로 작성해주세요.' }

  const rl = checkRateLimit(`industry:${await clientKey()}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.ok) return { status: 'error', message: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)` }

  const { data, error } = await supabaseService
    .from('inquiries')
    .insert({ type: 'INDUSTRY', name, email, affiliation, subject, message })
    .select('id')
    .single()
  if (error || !data) return { status: 'error', message: '저장에 실패했습니다.' }

  await sendInquiryNotification({
    id: data.id, type: 'INDUSTRY', name, email, affiliation, subject, message,
  })

  return { status: 'success' }
}
```

**Step 2: 기존 ContactForm 컴포넌트 호환성 확인**

`components/contact/contact-form.tsx`는 `useActionState(submitInquiry, INITIAL_STATE)` 형태. `submitInquiry` → `submitContactInquiry`로 이름만 변경:

```typescript
// components/contact/contact-form.tsx
// before
import { submitInquiry, INITIAL_STATE } from '@/app/actions/inquiries'
// after
import { submitContactInquiry, INITIAL_STATE } from '@/app/actions/inquiries'

// useActionState 라인
const [state, formAction] = useActionState(submitContactInquiry, INITIAL_STATE)
```

**Step 3: 타입체크 + Commit**

```bash
npx tsc --noEmit
git add app/actions/inquiries.ts components/contact/contact-form.tsx
git commit -m "feat(actions): rewrite inquiries to Supabase (general + industry)"
```

---

### Task 11: 파트너십 신청 Server Action + 폼

**Files:**
- Create: `app/actions/partners.ts`
- Create: `components/forms/partner-application-form.tsx`
- Modify: `app/(marketing)/partners/page.tsx` (폼 마운트)

**Step 1: `app/actions/partners.ts`**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendPartnerApplicationNotification } from '@/lib/email/notifications'
import { headers } from 'next/headers'

// Two clients: anon `supabase` exercises Storage RLS (anon upload allowed by
// bucket policy); `supabaseService` does the DB insert because partners SELECT
// policy `(status='approved' and published=true)` filters the RETURNING clause
// on the just-inserted pending row → would yield empty. `.insert({...})`
// hardcodes the field list, so defaults still enforce pending+unpublished.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/svg+xml'])

export type PartnerFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const PARTNER_INITIAL_STATE: PartnerFormState = { status: 'idle' }

async function clientKey() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'unknown'
}

export async function submitPartnerApplication(
  _prev: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  if (formData.get('website_hp')) return { status: 'success' }

  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const one_liner = String(formData.get('one_liner') ?? '').trim()
  const applicant_name = String(formData.get('applicant_name') ?? '').trim()
  const applicant_email = String(formData.get('applicant_email') ?? '').trim()
  const applicant_note = String(formData.get('applicant_note') ?? '').trim() || null
  const logo = formData.get('logo') as File | null

  if (!name || name.length > 120) return { status: 'error', message: '회사명을 확인해주세요.' }
  if (!['CORPORATE', 'CAPITAL', 'ACADEMIC'].includes(category))
    return { status: 'error', message: '카테고리를 선택해주세요.' }
  if (!one_liner || one_liner.length > 200) return { status: 'error', message: '한 줄 설명을 확인해주세요.' }
  if (!applicant_name || applicant_name.length > 80) return { status: 'error', message: '신청자 이름을 확인해주세요.' }
  if (!EMAIL_RE.test(applicant_email)) return { status: 'error', message: '신청자 이메일 형식을 확인해주세요.' }

  const rl = checkRateLimit(`partner:${await clientKey()}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.ok) return { status: 'error', message: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)` }

  const supabase = await createClient()

  let logo_url: string | null = null
  if (logo && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) return { status: 'error', message: '로고는 2MB 이하만 가능합니다.' }
    if (!LOGO_MIME.has(logo.type)) return { status: 'error', message: '로고는 PNG/JPEG/SVG만 허용됩니다.' }
    const ext = logo.type === 'image/svg+xml' ? 'svg' : logo.type === 'image/png' ? 'png' : 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage.from('partner-logos').upload(path, logo, {
      contentType: logo.type,
      upsert: false,
    })
    if (upErr) return { status: 'error', message: '로고 업로드에 실패했습니다.' }
    const { data: pub } = supabase.storage.from('partner-logos').getPublicUrl(path)
    logo_url = pub.publicUrl
  }

  const { data, error } = await supabaseService
    .from('partners')
    .insert({
      name, category, one_liner, logo_url,
      applicant_name, applicant_email, applicant_note,
    })
    .select('id')
    .single()
  if (error || !data) return { status: 'error', message: '저장에 실패했습니다.' }

  await sendPartnerApplicationNotification({
    id: data.id, name, category, one_liner,
    applicant_name, applicant_email, applicant_note,
  })

  return { status: 'success' }
}
```

**Step 2: `components/forms/partner-application-form.tsx`**

`components/contact/contact-form.tsx` 구조를 본떠 작성. 핵심:

```tsx
'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitPartnerApplication, PARTNER_INITIAL_STATE, type PartnerFormState } from '@/app/actions/partners'

export function PartnerApplicationForm() {
  const [state, action] = useActionState<PartnerFormState, FormData>(submitPartnerApplication, PARTNER_INITIAL_STATE)
  if (state.status === 'success') {
    return <SuccessBlock />
  }
  return (
    <form action={action} className="grid grid-cols-1 gap-4">
      <input type="text" name="website_hp" tabIndex={-1} autoComplete="off"
        className="absolute -left-[9999px]" aria-hidden />

      <Field name="name" label="회사명" required />
      <RadioRow name="category" label="카테고리"
        options={[{ value: 'CORPORATE', label: '기업' }, { value: 'CAPITAL', label: '캐피털' }, { value: 'ACADEMIC', label: '학계' }]} />
      <Field name="one_liner" label="한 줄 설명" required />
      <FileField name="logo" label="회사 로고 (선택, 2MB 이하 PNG/JPEG/SVG)" />
      <Field name="applicant_name" label="신청자 이름" required />
      <Field name="applicant_email" label="신청자 이메일" type="email" required />
      <Textarea name="applicant_note" label="추가 메모 (선택)" />

      {state.status === 'error' && <p className="text-sm text-red-600">{state.message}</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending}
      className="font-mono text-xs uppercase tracking-[0.28em] border border-fg-primary px-6 py-3 hover:bg-fg-primary hover:text-bg-base transition-colors disabled:opacity-50">
      {pending ? 'SENDING…' : 'SEND'}
    </button>
  )
}

function SuccessBlock() {
  return (
    <div className="border border-fg-primary p-6">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-fg-primary">SENT</p>
      <p className="mt-3 font-display text-sm text-fg-subtle">신청을 접수했습니다. 회장단 검토 후 메일로 회신드립니다.</p>
    </div>
  )
}

// Field, RadioRow, FileField, Textarea — 기존 contact-form.tsx의 패턴 그대로 추출/재사용
```

> 기존 `components/contact/contact-form.tsx`의 helper 컴포넌트(Field/RadioRow/Textarea 등)를 `components/forms/_shared.tsx`로 추출해 두 폼이 공유하면 DRY. 만약 시간이 부족하면 helper만 partner-application-form.tsx 안에 inline.

**Step 3: `/partners` 페이지에 폼 마운트**

`app/(marketing)/partners/page.tsx`의 EngageSection 아래 새 섹션 추가:

```tsx
import { PartnerApplicationForm } from '@/components/forms/partner-application-form'

// ... 기존 섹션들 ...

function ApplySection() {
  return (
    <section className="grid grid-cols-12 gap-x-8 md:gap-x-12 px-6 md:px-10 py-24 md:py-32">
      <div className="col-span-12 md:col-span-3 md:col-start-1">
        <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs">APPLY</p>
      </div>
      <div className="col-span-12 md:col-span-8 md:col-start-5">
        <h2 className="font-display text-3xl md:text-4xl text-fg-primary">파트너십 신청</h2>
        <p className="mt-4 font-display text-base md:text-lg text-fg-subtle">한 줄로 회사를 소개해주시면, 회장단이 검토 후 회신드립니다.</p>
        <div className="mt-10"><PartnerApplicationForm /></div>
      </div>
    </section>
  )
}
```

페이지 컴포넌트 body 안 EngageSection 아래에 `<ApplySection />` 추가.

**Step 4: 타입체크 + dev 검증**

```bash
npx tsc --noEmit
npm run dev
# http://localhost:3000/partners 끝까지 스크롤 → 폼 보이는지, 빈 칸 제출 시 에러 메시지 정상
```

**Step 5: Commit**

```bash
git add app/actions/partners.ts components/forms/partner-application-form.tsx app/\(marketing\)/partners/page.tsx
git commit -m "feat(partners): add application form with logo upload"
```

---

### Task 12: 산학협력 폼 마운트

**Files:**
- Create: `components/forms/industry-inquiry-form.tsx`
- Modify: `app/(marketing)/curriculum/page.tsx` (산학협력 섹션 + 폼 마운트)

**Step 1: `components/forms/industry-inquiry-form.tsx`**

partner form과 동일한 구조, `submitIndustryInquiry` 사용. 필드:

```tsx
<Field name="company" label="회사명" required />
<Field name="name" label="담당자 이름" required />
<Field name="email" label="이메일" type="email" required />
<RadioRow name="subject" label="문의 분류"
  options={[
    { value: '멘토링', label: '멘토링' },
    { value: '세션 진행', label: '세션 진행' },
    { value: '공동 프로젝트', label: '공동 프로젝트' },
    { value: '기타', label: '기타' },
  ]} />
<Textarea name="message" label="상세 메시지" required minLength={10} />
```

success 메시지: "산학협력 문의를 접수했습니다. 회장단이 회신드립니다."

**Step 2: `/curriculum` 페이지에 섹션 추가**

`app/(marketing)/curriculum/page.tsx`의 마지막 섹션(Closing) 위에 추가:

```tsx
import { IndustryInquiryForm } from '@/components/forms/industry-inquiry-form'

function IndustrySection() {
  return (
    <section className="grid grid-cols-12 gap-x-8 md:gap-x-12 px-6 md:px-10 py-24 md:py-32 border-t border-border">
      <div className="col-span-12 md:col-span-3 md:col-start-1">
        <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs">INDUSTRY</p>
      </div>
      <div className="col-span-12 md:col-span-8 md:col-start-5">
        <h2 className="font-display text-3xl md:text-4xl text-fg-primary">산학협력 문의</h2>
        <p className="mt-4 font-display text-base md:text-lg text-fg-subtle">멘토링, 세션 진행, 공동 프로젝트 — 함께 만들 일이 있다면 알려주세요.</p>
        <div className="mt-10"><IndustryInquiryForm /></div>
      </div>
    </section>
  )
}
```

페이지 body에 마운트.

**Step 3: 타입체크 + dev 검증 + Commit**

```bash
npx tsc --noEmit
git add components/forms/industry-inquiry-form.tsx app/\(marketing\)/curriculum/page.tsx
git commit -m "feat(curriculum): add industry partnership inquiry form"
```

---

### Task 13: 알럼나이 등록 — Server Action + 폼 + 페이지

**Files:**
- Create: `app/actions/alumni.ts`
- Create: `components/forms/alumni-registration-form.tsx`
- Create: `app/(marketing)/alumni/register/page.tsx`
- Modify: `app/(marketing)/alumni/page.tsx` (CTA 추가)

**Step 1: `app/actions/alumni.ts`**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { sendAlumniRegistrationNotification } from '@/lib/email/notifications'
import { headers } from 'next/headers'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STAGES = new Set(['idea', 'seed', 'seriesA', 'seriesB', 'growth', 'exit'])
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/svg+xml'])

export type AlumniFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export const ALUMNI_INITIAL_STATE: AlumniFormState = { status: 'idle' }

async function clientKey() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'unknown'
}

export async function submitAlumniRegistration(
  _prev: AlumniFormState,
  formData: FormData,
): Promise<AlumniFormState> {
  if (formData.get('website_hp')) return { status: 'success' }

  // alumni
  const name = String(formData.get('name') ?? '').trim()
  const cohortRaw = String(formData.get('cohort') ?? '').trim()
  const cohort = Number(cohortRaw)
  const email = String(formData.get('email') ?? '').trim()
  const job_title = String(formData.get('job_title') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const linkedin_url = String(formData.get('linkedin_url') ?? '').trim() || null

  if (!name || name.length > 80) return { status: 'error', message: '이름을 확인해주세요.' }
  if (!Number.isInteger(cohort) || cohort < 1 || cohort > 100)
    return { status: 'error', message: '기수를 1~100 사이로 입력해주세요.' }
  if (!EMAIL_RE.test(email)) return { status: 'error', message: '이메일 형식을 확인해주세요.' }
  if (!job_title || job_title.length > 120) return { status: 'error', message: '현재 활동/소속을 확인해주세요.' }
  if (!bio || bio.length > 200) return { status: 'error', message: '한 줄 소개는 200자 이하로 작성해주세요.' }

  // company (optional)
  const hasCompany = formData.get('has_company') === 'on'
  let company: {
    name: string; one_liner: string; stage: string | null; website_url: string | null;
    logo: File;
  } | null = null
  if (hasCompany) {
    const cName = String(formData.get('company_name') ?? '').trim()
    const cOne = String(formData.get('company_one_liner') ?? '').trim()
    const cStage = String(formData.get('company_stage') ?? '').trim() || null
    const cWeb = String(formData.get('company_website') ?? '').trim() || null
    const cLogo = formData.get('company_logo') as File | null
    if (!cName || cName.length > 120) return { status: 'error', message: '회사명을 확인해주세요.' }
    if (!cOne || cOne.length > 200) return { status: 'error', message: '회사 한 줄 설명을 확인해주세요.' }
    if (cStage && !STAGES.has(cStage)) return { status: 'error', message: '단계 값이 올바르지 않습니다.' }
    if (!cLogo || cLogo.size === 0) return { status: 'error', message: '회사 로고는 필수입니다.' }
    if (cLogo.size > MAX_LOGO_BYTES) return { status: 'error', message: '로고는 2MB 이하만 가능합니다.' }
    if (!LOGO_MIME.has(cLogo.type)) return { status: 'error', message: '로고는 PNG/JPEG/SVG만 허용됩니다.' }
    company = { name: cName, one_liner: cOne, stage: cStage, website_url: cWeb, logo: cLogo }
  }

  const rl = checkRateLimit(`alumni:${await clientKey()}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.ok) return { status: 'error', message: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초)` }

  // 수동 트랜잭션: alumni insert 먼저, 실패 시 단순 return; company insert
  // 실패 시 alumni row를 service_role로 cleanup. `supabase` (anon)은 Storage RLS
  // 검증용. DB insert는 `supabaseService` — alumni SELECT 정책이 RETURNING을
  // 막아 .select('id')가 비어버리는 문제를 피한다.
  const supabase = await createClient()
  const { data: alumniRow, error: aErr } = await supabaseService
    .from('alumni')
    .insert({ name, cohort, email, job_title, bio, linkedin_url })
    .select('id')
    .single()
  if (aErr || !alumniRow) return { status: 'error', message: '저장에 실패했습니다.' }

  let companyName: string | undefined
  if (company) {
    const ext = company.logo.type === 'image/svg+xml' ? 'svg' : company.logo.type === 'image/png' ? 'png' : 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage.from('alumni-company-logos').upload(path, company.logo, {
      contentType: company.logo.type, upsert: false,
    })
    if (upErr) {
      await supabaseService.from('alumni').delete().eq('id', alumniRow.id)  // rollback
      return { status: 'error', message: '로고 업로드에 실패했습니다.' }
    }
    const { data: pub } = supabase.storage.from('alumni-company-logos').getPublicUrl(path)

    const { error: cErr } = await supabaseService.from('alumni_companies').insert({
      founder_alumni_id: alumniRow.id,
      name: company.name,
      logo_url: pub.publicUrl,
      one_liner: company.one_liner,
      stage: company.stage,
      website_url: company.website_url,
    })
    if (cErr) {
      await supabaseService.from('alumni').delete().eq('id', alumniRow.id)  // rollback
      return { status: 'error', message: '회사 정보 저장에 실패했습니다.' }
    }
    companyName = company.name
  }

  await sendAlumniRegistrationNotification({
    alumniId: alumniRow.id, name, cohort, job_title, bio,
    hasCompany: !!company, companyName,
  })

  return { status: 'success' }
}
```

> 수동 트랜잭션: Supabase JS는 native transaction이 제한적이라 cleanup 방식 사용. service_role로 정리 — anon으로는 RLS 때문에 자기 row를 못 지움.

**Step 2: `components/forms/alumni-registration-form.tsx`**

partner form 패턴 + 토글로 회사 섹션 노출.

```tsx
'use client'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitAlumniRegistration, ALUMNI_INITIAL_STATE, type AlumniFormState } from '@/app/actions/alumni'

export function AlumniRegistrationForm() {
  const [state, action] = useActionState<AlumniFormState, FormData>(submitAlumniRegistration, ALUMNI_INITIAL_STATE)
  const [hasCompany, setHasCompany] = useState(false)
  if (state.status === 'success') return <Success />

  return (
    <form action={action} className="grid grid-cols-1 gap-6">
      <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" aria-hidden />

      <Fieldset legend="알럼나이 정보">
        <Field name="name" label="이름" required />
        <Field name="cohort" label="기수" type="number" min={1} max={100} required />
        <Field name="email" label="이메일 (회신용, 비공개)" type="email" required />
        <Field name="job_title" label="현재 활동/소속" required />
        <Textarea name="bio" label="한 줄 소개 (200자 이내)" required maxLength={200} />
        <Field name="linkedin_url" label="LinkedIn URL (선택)" type="url" />
      </Fieldset>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="has_company" checked={hasCompany} onChange={(e) => setHasCompany(e.target.checked)} />
        <span className="font-display text-sm text-fg-subtle">본인이 창업한 회사를 함께 등록하기</span>
      </label>

      {hasCompany && (
        <Fieldset legend="회사 정보">
          <Field name="company_name" label="회사명" required />
          <FileField name="company_logo" label="로고 (2MB 이하 PNG/JPEG/SVG)" accept="image/png,image/jpeg,image/svg+xml" required />
          <Textarea name="company_one_liner" label="회사 한 줄 설명" required maxLength={200} />
          <SelectField name="company_stage" label="단계"
            options={[
              { value: '', label: '선택' },
              { value: 'idea', label: 'Idea' },
              { value: 'seed', label: 'Seed' },
              { value: 'seriesA', label: 'Series A' },
              { value: 'seriesB', label: 'Series B' },
              { value: 'growth', label: 'Growth' },
              { value: 'exit', label: 'Exit' },
            ]} />
          <Field name="company_website" label="회사 웹사이트 (선택)" type="url" />
        </Fieldset>
      )}

      {state.status === 'error' && <p className="text-sm text-red-600">{state.message}</p>}
      <SubmitButton />
    </form>
  )
}

// Field/Fieldset/Textarea/FileField/SelectField/SubmitButton/Success — partner form과 같은 패턴
```

**Step 3: `/alumni/register` 페이지**

```tsx
// app/(marketing)/alumni/register/page.tsx
import type { Metadata } from 'next'
import { AlumniRegistrationForm } from '@/components/forms/alumni-registration-form'

export const metadata: Metadata = {
  title: '알럼나이 등록 — VERY',
}

export default function RegisterPage() {
  return (
    <main className="px-6 md:px-10 py-24 md:py-32">
      <div className="mx-auto max-w-2xl">
        <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs">ALUMNI · REGISTER</p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl text-fg-primary">알럼나이 등록</h1>
        <p className="mt-4 font-display text-base text-fg-subtle">VERY를 거쳐간 사람이라면 누구든 — 본인 정보와 (있다면) 회사도 함께 알려주세요. 회장단 승인 후 공개됩니다.</p>
        <div className="mt-12"><AlumniRegistrationForm /></div>
      </div>
    </main>
  )
}
```

**Step 4: `/alumni` 페이지에 CTA**

기존 페이지의 Closing 위 또는 적절한 위치에:

```tsx
import Link from 'next/link'

// ...
<Link href="/alumni/register" className="inline-block mt-8 font-mono text-xs uppercase tracking-[0.28em] border border-fg-primary px-6 py-3 hover:bg-fg-primary hover:text-bg-base transition-colors">
  알럼나이 등록하기 →
</Link>
```

**Step 5: 타입체크 + dev 검증 + Commit**

```bash
npx tsc --noEmit
git add app/actions/alumni.ts components/forms/alumni-registration-form.tsx app/\(marketing\)/alumni/
git commit -m "feat(alumni): add registration form with optional company submission"
```

---

### Task 14: Phase 3 종단 검증

**Step 1: dev 서버에서 4개 폼 모두 제출 테스트**

```bash
npm run dev
```

순서대로 검증:
- `/contact` → 폼 제출 → Supabase `inquiries`에 `type='GENERAL'` row, Gmail 알림 도착
- `/curriculum` 산학협력 섹션 → 제출 → `inquiries.type='INDUSTRY'` row + 알림
- `/partners` 신청 섹션 → 로고 첨부 + 제출 → `partners` row + Storage 파일 + 알림
- `/alumni/register` → 회사 토글 OFF로 제출 → `alumni` row + 알림
- `/alumni/register` → 회사 토글 ON + 로고 첨부 → `alumni` + `alumni_companies` 두 row + 알림 (제목에 "+회사")

**Step 2: 빌드 통과 확인**

```bash
npm run build
```

8개 라우트 + 새 `/alumni/register` 표시 + 모두 prerendered 또는 SSR.

**Step 3: Commit (없음 — 검증만, 코드 변경 X)**

문제 발견 시 수정 → 별도 fix 커밋.

---

## Phase 4 — Admin (6 tasks)

### Task 15: 인증 미들웨어 + admin layout + login

**Files:**
- Create: `middleware.ts` (리포 루트)
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/auth/callback/route.ts`
- Create: `lib/admin/is-admin.ts`

**Step 1: 미들웨어** — `middleware.ts`

> Next.js 16의 `middleware`는 Edge runtime. Supabase SSR 패턴은 `@supabase/ssr`의 `createServerClient` + 미들웨어용 NextResponse 패턴.

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }
  if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname.startsWith('/admin/auth')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // admins 화이트리스트 매칭 — anon 키로는 RLS 때문에 read 안 됨.
  // 우회: site_config 같이 public read인 view 만들거나, service_role을 미들웨어에 두는 건 위험.
  // 대신 RPC 함수를 만들어서 anon이 호출 시 본인 이메일만 검증하게 한다.
  // 0001 마이그레이션에 추가 필요한 RPC:
  //   create or replace function public.is_admin(check_email text)
  //   returns boolean language sql security definer as
  //   $$ select exists(select 1 from public.admins where email = check_email) $$;
  //   grant execute on function public.is_admin(text) to anon, authenticated;
  const { data: ok, error } = await supabase.rpc('is_admin', { check_email: user.email })
  if (error || !ok) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

**Step 2: `0001_initial_schema.sql`에 RPC 추가**

> 위 미들웨어가 의존하는 `is_admin` 함수. 이미 마이그레이션 적용했다면 별도 migration `0002_is_admin_rpc.sql`로 추가:

```sql
create or replace function public.is_admin(check_email text)
returns boolean language sql security definer as $$
  select exists(select 1 from public.admins where email = check_email);
$$;
grant execute on function public.is_admin(text) to anon, authenticated;
```

Supabase SQL Editor에서 실행 또는 MCP `apply_migration`.

**Step 3: helper** — `lib/admin/is-admin.ts`

```typescript
import 'server-only'
import { createClient } from '@/lib/supabase/server'

/** 미들웨어가 이미 검증했지만 admin Server Action에서 추가 안전망으로 호출 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('unauthorized')
  const { data: ok } = await supabase.rpc('is_admin', { check_email: user.email })
  if (!ok) throw new Error('unauthorized')
  return user.email
}
```

**Step 4: login 페이지** — `app/admin/login/page.tsx`

```tsx
'use client'
import { createClient } from '@/lib/supabase/browser'

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm border border-border p-10">
        <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary md:text-xs">VERY · ADMIN</p>
        <h1 className="mt-4 font-display text-2xl text-fg-primary">로그인</h1>
        <ErrorBanner sp={searchParams} />
        <button onClick={signInWithGoogle}
          className="mt-8 w-full font-mono text-xs uppercase tracking-[0.28em] border border-fg-primary px-6 py-3 hover:bg-fg-primary hover:text-bg-base transition-colors">
          Google로 로그인
        </button>
        <p className="mt-6 font-display text-xs text-fg-muted">임원진 화이트리스트에 등록된 이메일만 접근 가능합니다.</p>
      </div>
    </main>
  )
}

async function signInWithGoogle() {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/admin/auth/callback` },
  })
}

function ErrorBanner({ sp }: { sp: Promise<{ error?: string }> }) {
  // searchParams는 promise. use(sp) 또는 sync 사용 불가하므로 client side check
  return null  // 단순화 — 필요시 use() 활용
}
```

**Step 5: OAuth callback** — `app/admin/auth/callback/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${url.origin}/admin`)
}
```

**Step 6: Supabase 대시보드에서 Google OAuth 활성화**

- Supabase 대시보드 → **Authentication → Providers → Google** → Enable
- Client ID/Secret이 필요 → Google Cloud Console에서 OAuth 2.0 클라이언트 생성
- Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
- 시간 부족 시 이 step은 **사용자가 직접 진행**

**Step 7: admin layout** — `app/admin/layout.tsx`

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'VERY · Admin',
  robots: 'noindex',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <aside className="fixed inset-y-0 left-0 w-56 border-r border-border p-6 flex flex-col gap-1">
        <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary mb-6">VERY · ADMIN</p>
        <NavLink href="/admin">대시보드</NavLink>
        <NavLink href="/admin/applications">신청 큐</NavLink>
        <NavLink href="/admin/inquiries">문의</NavLink>
        <NavLink href="/admin/alumni">알럼나이</NavLink>
        <NavLink href="/admin/partners">파트너</NavLink>
      </aside>
      <main className="ml-56 p-10">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href as any} className="font-mono text-xs uppercase tracking-[0.28em] text-fg-subtle hover:text-fg-primary px-2 py-2">
      {children}
    </Link>
  )
}
```

**Step 8: 타입체크 + Commit**

```bash
npx tsc --noEmit
git add middleware.ts app/admin/ lib/admin/ supabase/migrations/0002_is_admin_rpc.sql
git commit -m "feat(admin): auth middleware + login + layout + OAuth callback"
```

---

### Task 16: Admin 대시보드

**Files:**
- Create: `app/admin/page.tsx`

**Step 1: 페이지**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'  // 항상 fresh count

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [alumniPending, partnerPending, inquiriesNew] = await Promise.all([
    supabase.from('alumni').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('partners').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])

  const total = (alumniPending.count ?? 0) + (partnerPending.count ?? 0)

  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">DASHBOARD</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">오늘의 처리할 일</h1>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <Card href="/admin/applications" label="대기 중 신청" count={total} hint={`알럼나이 ${alumniPending.count ?? 0} · 파트너 ${partnerPending.count ?? 0}`} />
        <Card href="/admin/inquiries" label="미처리 문의" count={inquiriesNew.count ?? 0} hint="GENERAL + INDUSTRY" />
      </div>
    </div>
  )
}

function Card({ href, label, count, hint }: { href: string; label: string; count: number; hint: string }) {
  return (
    <Link href={href as any} className="block border border-border p-6 hover:border-fg-primary transition-colors">
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">{label}</p>
      <p className="mt-4 font-display text-5xl text-fg-primary">{count}</p>
      <p className="mt-4 font-display text-xs text-fg-subtle">{hint}</p>
    </Link>
  )
}
```

> RLS가 anon은 pending row를 못 읽으므로 — 미들웨어 통과 시점에 user 인증된 상태지만 anon key 사용. `admins` 매칭은 됐지만 select은 여전히 anon 정책 적용. 해결: admin Server Action에서 service_role 사용 또는 admins JWT 클레임으로 RLS bypass.
>
> 가장 간단한 방안 — **모든 admin 페이지의 select도 service_role 사용**. select는 보안상 service_role로 해도 큰 위험 없음 (이미 미들웨어가 통과시킨 admin). 단, 클라이언트 노출 안 되도록 server component에서만.
>
> 위 코드를 다음처럼 수정 (Step 2):

**Step 2: service_role 기반 admin select 모듈** — `lib/admin/queries.ts`

```typescript
import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

export async function getAdminCounts() {
  const [alumniPending, partnerPending, inquiriesNew] = await Promise.all([
    supabaseService.from('alumni').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseService.from('partners').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseService.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ])
  return {
    alumniPending: alumniPending.count ?? 0,
    partnerPending: partnerPending.count ?? 0,
    inquiriesNew: inquiriesNew.count ?? 0,
  }
}
```

dashboard 페이지에서 `getAdminCounts()` 호출.

**Step 3: 타입체크 + Commit**

```bash
npx tsc --noEmit
git add app/admin/page.tsx lib/admin/queries.ts
git commit -m "feat(admin): dashboard with pending counts"
```

---

### Task 17: 신청 큐 + 상세 + 승인/거절

**Files:**
- Create: `app/admin/applications/page.tsx`
- Create: `app/admin/applications/[type]/[id]/page.tsx`
- Create: `app/admin/actions/applications.ts`
- Modify: `lib/admin/queries.ts` (목록 함수 추가)

**Step 1: 목록 쿼리** — `lib/admin/queries.ts` 확장

```typescript
export async function getPendingApplications() {
  const [alumni, partners] = await Promise.all([
    supabaseService
      .from('alumni')
      .select(`
        id, name, cohort, job_title, created_at,
        alumni_companies!alumni_companies_founder_alumni_id_fkey ( id, name )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabaseService
      .from('partners')
      .select('id, name, category, applicant_name, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ])
  return {
    alumni: alumni.data ?? [],
    partners: partners.data ?? [],
  }
}

export async function getApplicationDetail(type: 'alumni' | 'partner', id: string) {
  if (type === 'alumni') {
    const { data } = await supabaseService
      .from('alumni')
      .select(`
        *, alumni_companies!alumni_companies_founder_alumni_id_fkey ( * )
      `)
      .eq('id', id)
      .maybeSingle()
    return data
  }
  const { data } = await supabaseService
    .from('partners')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data
}
```

**Step 2: 큐 페이지** — `app/admin/applications/page.tsx`

```tsx
import Link from 'next/link'
import { getPendingApplications } from '@/lib/admin/queries'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const { alumni, partners } = await getPendingApplications()

  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">QUEUE</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">신청 큐</h1>

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>종류</Th><Th>요약</Th><Th>접수일</Th><Th>액션</Th>
          </tr>
        </thead>
        <tbody>
          {alumni.map((a) => (
            <tr key={a.id} className="border-b border-border">
              <Td>🎓 알럼나이</Td>
              <Td>{a.name} · {a.cohort}기 · {a.job_title}{(a.alumni_companies as { id: string }[]).length > 0 ? ` (+회사 ${(a.alumni_companies as { id: string }[]).length})` : ''}</Td>
              <Td>{new Date(a.created_at).toLocaleDateString('ko-KR')}</Td>
              <Td><Link href={`/admin/applications/alumni/${a.id}` as any} className="underline">상세</Link></Td>
            </tr>
          ))}
          {partners.map((p) => (
            <tr key={p.id} className="border-b border-border">
              <Td>🤝 파트너</Td>
              <Td>{p.name} · {p.category} · {p.applicant_name}</Td>
              <Td>{new Date(p.created_at).toLocaleDateString('ko-KR')}</Td>
              <Td><Link href={`/admin/applications/partner/${p.id}` as any} className="underline">상세</Link></Td>
            </tr>
          ))}
          {alumni.length === 0 && partners.length === 0 && (
            <tr><Td colSpan={4}><p className="py-12 text-center text-fg-muted">대기 중인 신청이 없습니다.</p></Td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3">{children}</th>
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="py-4">{children}</td>
}
```

**Step 3: Server Actions** — `app/admin/actions/applications.ts`

```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'

export async function approveAlumni(id: string) {
  await requireAdmin()
  const now = new Date().toISOString()
  await supabaseService.from('alumni').update({ status: 'approved', published: true, approved_at: now }).eq('id', id)
  // 동반 회사도 같이 승인
  await supabaseService.from('alumni_companies').update({ status: 'approved', published: true, approved_at: now }).eq('founder_alumni_id', id)
  revalidatePath('/alumni')
  revalidatePath('/admin/applications')
}

export async function approvePartner(id: string) {
  await requireAdmin()
  await supabaseService.from('partners').update({
    status: 'approved', published: true, approved_at: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/partners')
  revalidatePath('/admin/applications')
}

export async function rejectApplication(type: 'alumni' | 'partner', id: string, reason: string) {
  await requireAdmin()
  if (type === 'alumni') {
    await supabaseService.from('alumni').update({ status: 'rejected', reject_reason: reason }).eq('id', id)
    await supabaseService.from('alumni_companies').update({ status: 'rejected', reject_reason: reason }).eq('founder_alumni_id', id)
  } else {
    await supabaseService.from('partners').update({ status: 'rejected', reject_reason: reason }).eq('id', id)
  }
  revalidatePath('/admin/applications')
}
```

**Step 4: 상세 페이지** — `app/admin/applications/[type]/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getApplicationDetail } from '@/lib/admin/queries'
import { approveAlumni, approvePartner, rejectApplication } from '@/app/admin/actions/applications'

export const dynamic = 'force-dynamic'

export default async function DetailPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params
  if (type !== 'alumni' && type !== 'partner') notFound()
  const data = await getApplicationDetail(type as 'alumni' | 'partner', id)
  if (!data) notFound()

  return (
    <div className="max-w-2xl">
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">{type === 'alumni' ? '알럼나이 신청' : '파트너 신청'}</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">{(data as { name: string }).name}</h1>

      <dl className="mt-10 grid grid-cols-[120px_1fr] gap-y-3 text-sm">
        {Object.entries(data).map(([k, v]) => {
          if (v === null || k === 'id' || typeof v === 'object') return null
          return (
            <>
              <dt key={`${k}-dt`} className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">{k}</dt>
              <dd key={`${k}-dd`} className="text-fg-subtle">{String(v)}</dd>
            </>
          )
        })}
      </dl>

      {type === 'alumni' && (data as { alumni_companies?: unknown[] }).alumni_companies && (data as { alumni_companies: { name: string; logo_url: string; one_liner: string }[] }).alumni_companies.length > 0 && (
        <div className="mt-10 border-t border-border pt-10">
          <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">동반 회사</p>
          {(data as { alumni_companies: { name: string; logo_url: string; one_liner: string }[] }).alumni_companies.map((c, i) => (
            <div key={i} className="mt-4 flex items-start gap-4">
              <Image src={c.logo_url} alt={c.name} width={64} height={64} className="border border-border" />
              <div>
                <p className="font-display text-base text-fg-primary">{c.name}</p>
                <p className="text-sm text-fg-subtle">{c.one_liner}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex gap-3">
        <form action={async () => {
          'use server'
          if (type === 'alumni') await approveAlumni(id)
          else await approvePartner(id)
        }}>
          <button className="font-mono text-xs uppercase tracking-[0.28em] border border-fg-primary px-6 py-3 hover:bg-fg-primary hover:text-bg-base transition-colors">
            승인
          </button>
        </form>
        <form action={async (formData) => {
          'use server'
          await rejectApplication(type as 'alumni' | 'partner', id, String(formData.get('reason') ?? ''))
        }} className="flex gap-2">
          <input name="reason" placeholder="거절 사유 (선택)" className="border border-border px-3 py-2 text-sm" />
          <button className="font-mono text-xs uppercase tracking-[0.28em] border border-red-600 text-red-600 px-6 py-3">거절</button>
        </form>
      </div>
    </div>
  )
}
```

> Next.js 16에서 `next/image` 외부 도메인 사용은 `next.config.ts`의 `images.remotePatterns`에 Supabase 도메인 추가 필요.

**Step 5: `next.config.ts` 수정**

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: { typedRoutes: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '<project-ref>.supabase.co' },
    ],
  },
  // ... 기존 설정
}

export default config
```

**Step 6: 타입체크 + Commit**

```bash
npx tsc --noEmit
git add app/admin/applications/ app/admin/actions/ lib/admin/queries.ts next.config.ts
git commit -m "feat(admin): applications queue, detail, approve/reject"
```

---

### Task 18: 문의 페이지 + 상태 토글

**Files:**
- Create: `app/admin/inquiries/page.tsx`
- Create: `app/admin/actions/inquiries.ts`

**Step 1: queries 확장**

```typescript
// lib/admin/queries.ts
export async function getInquiries() {
  const { data } = await supabaseService
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}
```

**Step 2: 페이지**

```tsx
import { getInquiries } from '@/lib/admin/queries'
import { updateInquiryStatus } from '@/app/admin/actions/inquiries'

export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'in_progress', 'done'] as const

export default async function InquiriesPage() {
  const rows = await getInquiries()
  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">INQUIRIES</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">문의</h1>

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>유형</Th><Th>이름</Th><Th>이메일</Th><Th>분류</Th><Th>상태</Th><Th>접수</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border align-top">
              <Td><span className="text-xs uppercase tracking-wider">{r.type === 'INDUSTRY' ? '산학협력' : '일반'}</span></Td>
              <Td>{r.name}{r.affiliation ? <span className="block text-xs text-fg-muted">{r.affiliation}</span> : null}</Td>
              <Td><a href={`mailto:${r.email}`} className="underline">{r.email}</a></Td>
              <Td>{r.subject}</Td>
              <Td>
                <form action={async (fd) => {
                  'use server'
                  await updateInquiryStatus(r.id, String(fd.get('status')) as 'new'|'in_progress'|'done')
                }}>
                  <select name="status" defaultValue={r.status} className="border border-border px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="ml-2 text-xs underline">변경</button>
                </form>
              </Td>
              <Td>{new Date(r.created_at).toLocaleDateString('ko-KR')}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td colSpan={6}><p className="py-12 text-center text-fg-muted">문의가 없습니다.</p></Td></tr>}
        </tbody>
      </table>

      {/* 메시지 펼침은 후속 — MVP에선 mailto로 답장 */}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3 pr-4">{children}</th>
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="py-4 pr-4 text-fg-subtle">{children}</td>
}
```

> 메시지 전문은 행 클릭 시 펼침이 이상적이지만 MVP에선 mailto만으로 통과. 임원진은 회신 시 본인 메일 클라이언트에서 본문을 적습니다. 메시지 펼침은 Phase 2 enhancement.

**Step 3: action**

```typescript
// app/admin/actions/inquiries.ts
'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'

export async function updateInquiryStatus(id: string, status: 'new' | 'in_progress' | 'done') {
  await requireAdmin()
  await supabaseService.from('inquiries').update({ status }).eq('id', id)
  revalidatePath('/admin/inquiries')
}
```

**Step 4: 타입체크 + Commit**

```bash
npx tsc --noEmit
git add app/admin/inquiries/ app/admin/actions/inquiries.ts lib/admin/queries.ts
git commit -m "feat(admin): inquiries page with status toggle"
```

---

### Task 19: 승인된 알럼나이 + 파트너 페이지 (노출 토글)

**Files:**
- Create: `app/admin/alumni/page.tsx`
- Create: `app/admin/partners/page.tsx`
- Create: `app/admin/actions/publish.ts`

**Step 1: action**

```typescript
// app/admin/actions/publish.ts
'use server'
import { revalidatePath } from 'next/cache'
import { supabaseService } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/admin/is-admin'

export async function toggleAlumniPublished(id: string, value: boolean) {
  await requireAdmin()
  await supabaseService.from('alumni').update({ published: value }).eq('id', id)
  revalidatePath('/alumni')
  revalidatePath('/admin/alumni')
}

export async function toggleAlumniCompanyPublished(id: string, value: boolean) {
  await requireAdmin()
  await supabaseService.from('alumni_companies').update({ published: value }).eq('id', id)
  revalidatePath('/alumni')
  revalidatePath('/admin/alumni')
}

export async function togglePartnerPublished(id: string, value: boolean) {
  await requireAdmin()
  await supabaseService.from('partners').update({ published: value }).eq('id', id)
  revalidatePath('/partners')
  revalidatePath('/admin/partners')
}
```

**Step 2: queries 확장**

```typescript
// lib/admin/queries.ts
export async function getApprovedAlumni() {
  const { data } = await supabaseService
    .from('alumni')
    .select('id, name, cohort, job_title, published')
    .eq('status', 'approved')
    .order('cohort', { ascending: false })
  return data ?? []
}

export async function getApprovedPartners() {
  const { data } = await supabaseService
    .from('partners')
    .select('id, name, category, published, sort_order')
    .eq('status', 'approved')
    .order('sort_order', { ascending: true })
  return data ?? []
}
```

**Step 3: 알럼나이 페이지**

```tsx
import { getApprovedAlumni } from '@/lib/admin/queries'
import { toggleAlumniPublished } from '@/app/admin/actions/publish'

export const dynamic = 'force-dynamic'

export default async function AdminAlumniPage() {
  const rows = await getApprovedAlumni()
  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">ALUMNI</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">승인된 알럼나이</h1>

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>이름</Th><Th>기수</Th><Th>현재</Th><Th>노출</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <Td>{r.name}</Td>
              <Td>{r.cohort}기</Td>
              <Td>{r.job_title}</Td>
              <Td>
                <form action={async () => {
                  'use server'
                  await toggleAlumniPublished(r.id, !r.published)
                }}>
                  <button className={`text-xs underline ${r.published ? 'text-green-700' : 'text-fg-muted'}`}>
                    {r.published ? 'ON' : 'OFF'}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td colSpan={4}><p className="py-12 text-center text-fg-muted">아직 승인된 알럼나이가 없습니다.</p></Td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3 pr-4">{children}</th>
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="py-4 pr-4 text-fg-subtle">{children}</td>
}
```

**Step 4: 파트너 페이지** — 같은 패턴, `togglePartnerPublished` 사용

```tsx
import { getApprovedPartners } from '@/lib/admin/queries'
import { togglePartnerPublished } from '@/app/admin/actions/publish'

export const dynamic = 'force-dynamic'

export default async function AdminPartnersPage() {
  const rows = await getApprovedPartners()
  return (
    <div>
      <p translate="no" className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary">PARTNERS</p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">승인된 파트너</h1>

      <table className="mt-10 w-full text-sm">
        <thead className="border-b border-border">
          <tr className="text-left">
            <Th>회사</Th><Th>카테고리</Th><Th>순서</Th><Th>노출</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <Td>{r.name}</Td>
              <Td>{r.category}</Td>
              <Td>{r.sort_order}</Td>
              <Td>
                <form action={async () => {
                  'use server'
                  await togglePartnerPublished(r.id, !r.published)
                }}>
                  <button className={`text-xs underline ${r.published ? 'text-green-700' : 'text-fg-muted'}`}>
                    {r.published ? 'ON' : 'OFF'}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td colSpan={4}><p className="py-12 text-center text-fg-muted">아직 승인된 파트너가 없습니다.</p></Td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted py-3 pr-4">{children}</th>
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="py-4 pr-4 text-fg-subtle">{children}</td>
}
```

**Step 5: 타입체크 + Commit**

```bash
npx tsc --noEmit
git add app/admin/alumni/ app/admin/partners/ app/admin/actions/publish.ts lib/admin/queries.ts
git commit -m "feat(admin): approved alumni + partners management with publish toggle"
```

---

### Task 20: Phase 4 종단 검증

**Step 1: dev 서버**

```bash
npm run dev
```

검증 시나리오:

1. `/admin` 접속 → 미로그인 → `/admin/login`으로 redirect
2. Google 로그인 → 본인(admins에 있는) 이메일이면 `/admin` 통과
3. admins에 없는 이메일로 로그인 → "권한 없음" 에러 + 로그아웃
4. 대시보드에 대기 카운트 표시
5. `/admin/applications` → 신청 리스트 → 상세 → 승인 → `/alumni`(또는 `/partners`)에서 row 노출 확인 (혹은 60초 후)
6. `/admin/inquiries` → 상태 변경 확인
7. `/admin/alumni`, `/admin/partners` 노출 토글 → 공개 페이지 반영

**Step 2: Commit (없음 — 검증)**

문제 시 fix 커밋 별도.

---

## Phase 5 — 배포 (2 tasks)

### Task 21: 빌드 통과 + Preview 배포 + 종단 테스트

**Files:** 없음 (검증·배포)

**Step 1: 로컬 빌드**

```bash
npm run build
```

Expected: 전 라우트 prerender/SSR 통과. 새 라우트 표시:
- `/admin`, `/admin/login`, `/admin/applications`, `/admin/applications/[type]/[id]`, `/admin/inquiries`, `/admin/alumni`, `/admin/partners`
- `/alumni/register`
- 기존 8개 라우트 유지

**Step 2: develop preview 배포**

```bash
git push origin develop
```

Vercel preview URL 받기. 4개 폼 모두 종단 테스트:

1. `/contact` → 제출 → Supabase `inquiries` row 확인 + Gmail 알림 수신
2. `/curriculum#industry` 또는 산학협력 섹션 → 제출 → 동일 검증
3. `/partners` → 신청 폼 → 로고 첨부 → 제출 → Storage 파일 + row + 알림
4. `/<preview>/alumni/register` → 회사 토글 ON → 로고 첨부 → 제출 → 두 row + 알림

5. `<preview>/admin` 로그인 → 각 신청 승인 → 공개 페이지에서 노출 확인

**Step 3: 문제 발견 시**

발견한 모든 버그를 fix 커밋으로 처리. preview에 재배포 후 재검증.

---

### Task 22: Production 배포 + 정리

**Files:**
- Modify: `docs/PROGRESS.md`

**Step 1: PROGRESS.md 갱신**

기존 진행 상황 스냅샷에 새 라우트·기능을 추가. 섹션:
- 1번 배포된 라우트 표에 `/alumni/register`, `/admin/*` 추가
- 5번 기술 스택에 Supabase, Resend 추가
- 9번 결정 원칙에 "Supabase 백엔드 전환 (2026-05-24)" 추가

**Step 2: Vercel env 정리 (사용자 작업)**

- Vercel → Settings → Environment Variables → `NOTION_TOKEN`, `NOTION_DB_PARTNERS`, `NOTION_DB_SITE_CONFIG`, `NOTION_DB_INQUIRIES` 4개 삭제 (production + preview)

**Step 3: main 배포**

```bash
git checkout main
git merge --ff-only develop
git push origin main
git checkout develop
```

Vercel이 자동 production 배포.

**Step 4: production 종단 테스트 (간단)**

production URL에서 각 폼 한 번씩 제출 → DB row + 알림 확인. admin 로그인 → 한 건 승인 → 공개 페이지 반영.

**Step 5: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: refresh PROGRESS for supabase migration"
git push origin develop
git checkout main && git merge --ff-only develop && git push origin main && git checkout develop
```

---

## 완료 신호

- [ ] 모든 task의 commit이 main에 머지됨
- [ ] production에서 4개 폼 종단 동작 (DB + 알림 + admin 승인 + 공개 반영)
- [ ] PROGRESS.md 최신화
- [ ] Vercel env에서 NOTION_* 4개 제거됨
- [ ] `lib/notion/*`, `lib/server/site-config-cache.ts`, `docs/notion-setup.md` 완전 삭제
- [ ] 임원진 1명 이상이 admins 테이블에 등록되어 로그인 가능

다음 세션: 전 페이지 카피 리라이트(번역체 → 자연스러운 한국어 + 한국 정서 비유). 이 plan의 out of scope.
