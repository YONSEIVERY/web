# Supabase 마이그레이션 + 신청·승인 워크플로 — Design

> 작성일: 2026-05-24
>
> 이 문서는 brainstorming 결과의 확정본입니다. 다음 단계는 같은 디렉터리의 `2026-05-24-supabase-migration-plan.md`(별도 작성 예정) 구현 계획입니다.

## 컨텍스트

기존 Notion 백엔드 트랙(`docs/notion-setup.md`)으로 진행하던 중, 새 요구사항이 들어왔습니다.

1. `/curriculum` 산학협력 문의 폼
2. `/partners` 파트너십 신청 폼 (회사 로고 업로드)
3. `/alumni` 알럼나이 등록 폼 (+ 본인 창업 회사 등록, 로고 업로드)
4. 위 신청들의 **관리자 승인** 워크플로 → 결과적으로 **관리자 페이지** 필요
5. 폼 제출 시 학회 Gmail로 알림

Notion으로는 로고 업로드·승인 워크플로·다수 폼·관리자 페이지가 모두 약점 영역이라, **Supabase로 백엔드를 갈아끼우기로 결정**했습니다.

또한 사용자 피드백으로 **전 페이지 카피 리라이트(번역체 → 자연스러운 한국어 + 한국 정서 비유)** 가 필요하지만, 이는 별도 트랙으로 분리합니다 (백엔드 먼저).

## 확정된 결정 4개 (brainstorming 차수별)

1. **DB 백엔드**: Notion → Supabase 풀 전환
2. **알럼나이 ↔ 알럼나이 회사 관계**: 한 폼에 통합 (회사 정보 토글, 한 트랜잭션에 두 row insert)
3. **관리자 로그인**: 임원진 개인 Gmail Google OAuth + `admins` 테이블 화이트리스트
4. **작업 트랙 순서**: 백엔드(이 design) 먼저, 카피 리라이트는 별도 세션

## 이번 트랙의 out of scope

- 전 페이지 카피 리라이트 (별도 세션)
- 기존 알럼나이(과거 기수) 일괄 import (필요 시 별도 결정)
- `/admin/site-config` 편집 UI (Phase 2 — 학기당 1회라 SQL 직접 수정으로 충분)
- 신청자에게 승인 결과 자동 메일 (Phase 2 — admin이 mailto로 회신)
- audit log 테이블 / 2FA / SSO
- 발신 도메인 `yonseivery.com` 검증 (MVP는 `resend.dev` 기본 도메인)

---

## §1. Architecture

### 스택 변화

| 레이어 | 현재 | 변경 후 |
| --- | --- | --- |
| DB | Notion 3 DB (read+write) | Supabase Postgres |
| 파일 저장소 | — | Supabase Storage (회사 로고) |
| 인증 | — | Supabase Auth (Google OAuth) + `admins` 화이트리스트 |
| 이메일 알림 | Notion automation (미검증) | Resend API |
| 폼 처리 | Server Actions | Server Actions (유지) |
| 캐시 | ISR `revalidate=60` | 동일 + `revalidatePath` on admin 승인 |

### 런타임 데이터 흐름

```
[공개 페이지]
  RSC → Supabase select (RLS: published=true) → ISR 60초

[신청 폼 4개]
  /contact, /curriculum 산학협력, /partners 신청, /alumni 등록
  Client form → Server Action
    ├─ (옵션) Storage 로고 업로드
    ├─ Postgres insert (status='pending')
    └─ Resend → yonseivery1997@gmail.com 알림

[Admin]
  /admin/* (Supabase Auth 미들웨어 + admins 화이트리스트)
    승인/거절/노출 토글 → Postgres update → revalidatePath('/alumni' 등)
```

### 폐기 대상

`lib/notion/*`, `lib/server/site-config-cache.ts`, `app/actions/inquiries.ts`(재작성), `docs/notion-setup.md`. `lib/content/site.ts`의 `SITE` 상수는 유지.

### 새 의존성

```bash
npm install @supabase/supabase-js @supabase/ssr resend @react-email/components react-email
```

### 환경변수 (4개 신규, 기존 NOTION_* 4개 제거)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # admin Server Action 전용
RESEND_API_KEY=
```

---

## §2. Data Model

**6개 테이블 + 2개 Storage 버킷.**

### `admins` — 임원진 화이트리스트

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid PK | |
| email | text unique | Google OAuth `email` claim과 매칭 |
| name | text | 표시용 |
| created_at | timestamptz | |

### `site_config` — 단일 행

`key='current'` 한 행. 기존 Notion site_config 스키마 그대로 이식.

| 필드 | 타입 |
| --- | --- |
| key | text PK |
| cohort | int |
| year | int |
| semester | text ('1학기' \| '2학기') |
| since_year | int |
| updated_at | timestamptz |

### `alumni` — 알럼나이 개인

| 필드 | 타입 | 노출 | 비고 |
| --- | --- | --- | --- |
| id | uuid PK | | |
| name | text | ✓ | |
| cohort | int | ✓ | 기수 |
| email | text | admin only | 회신용 |
| current_role | text | ✓ | "현재 활동/소속" |
| bio | text | ✓ | 한 줄 소개 |
| linkedin_url | text? | ✓ | 옵션 |
| status | text | | `pending`/`approved`/`rejected` |
| reject_reason | text? | admin only | |
| published | bool | | 승인 후 노출 토글 |
| created_at, updated_at, approved_at | timestamptz | | |

### `alumni_companies` — 알럼나이 창업 회사

| 필드 | 타입 | 노출 | 비고 |
| --- | --- | --- | --- |
| id | uuid PK | | |
| founder_alumni_id | uuid FK → alumni.id | admin only | NULL 허용 |
| name | text | ✓ | |
| logo_url | text | ✓ | Storage URL |
| one_liner | text | ✓ | 한 줄 설명 |
| stage | text? | ✓ | `idea`/`seed`/`seriesA`/`seriesB`/`growth`/`exit` |
| website_url | text? | ✓ | |
| status, reject_reason, published, timestamps | | | alumni와 동일 |

**한 폼 통합 흐름:** 알럼나이 등록 폼에서 "본인 창업 회사 등록" 토글 ON 시, 한 트랜잭션으로 두 row 생성, `founder_alumni_id`로 연결. admin은 신청 카드 1개로 봅니다 (승인 한 번에 둘 다).

### `partners` — 공식 파트너

| 필드 | 타입 | 노출 | 비고 |
| --- | --- | --- | --- |
| id | uuid PK | | |
| name | text | ✓ | |
| category | text | ✓ | `CORPORATE`/`CAPITAL`/`ACADEMIC` |
| one_liner | text | ✓ | 회사가 무엇을 하는지 (파트너십 조건 노출 X) |
| logo_url | text? | ✓ | |
| sort_order | int | | admin 수동 조정 |
| applicant_name | text | admin only | |
| applicant_email | text | admin only | |
| applicant_note | text? | admin only | |
| status, reject_reason, published, timestamps | | | |

### `inquiries` — 일반·산학협력 통합 문의

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid PK | |
| type | text | `GENERAL`/`INDUSTRY` |
| name | text | |
| email | text | |
| affiliation | text? | INDUSTRY는 회사명 필수 |
| subject | text | GENERAL: RECRUIT/PARTNERSHIP/PRESS/OTHER. INDUSTRY: 자유/select |
| message | text | |
| status | text | `new`/`in_progress`/`done` |
| created_at | timestamptz | |

### Storage 버킷 (2개, public read)

- `alumni-company-logos` — max 2MB, mime: image/png\|jpeg\|svg+xml
- `partner-logos` — 동일

### RLS 정책 요약

- **public SELECT** (alumni/alumni_companies/partners): `published=true AND status='approved'` 만
- **public SELECT** (site_config): 모든 행
- **anon INSERT** (alumni/alumni_companies/partners/inquiries): 허용, `status='pending' published=false` 트리거로 강제
- **anon UPDATE/DELETE**: 전부 deny
- **admin ALL**: Server Action에서 service_role key 사용 (RLS 우회), 미들웨어가 `admins` 매칭 검증

---

## §3. 폼 4개 흐름

### 공통 패턴

```
Client form (useActionState + useFormStatus)
  → Server Action
      ├─ Honeypot (silent success on hit)
      ├─ Rate limit (IP 5건/시간, 기존 lib/server/rate-limit.ts 재사용)
      ├─ (옵션) Storage 로고 업로드
      ├─ Supabase insert (status='pending')
      └─ Resend → yonseivery1997@gmail.com
  → "접수되었습니다" 확인 UI
```

발신: 단계별 (§5). 제목 예: `[VERY] 신규 알럼나이 신청 — 박지훈 (43기)`. 본문에 신청 요약 + admin deep link.

### Form 1 — `/contact` 일반 문의 (재이식)

폼·UI는 기존 `ContactForm` 컴포넌트 그대로. Server Action만 Notion → Supabase. 필드: 이름·이메일·소속(옵션)·용건 라디오·메시지. → `inquiries(type='GENERAL')`.

### Form 2 — `/curriculum` 산학협력 문의 (신규)

위치: `/curriculum` 페이지 하단 "산학협력" 섹션.

| 필드 | 필수 | 비고 |
| --- | --- | --- |
| 회사명 | ✓ | |
| 담당자 이름 | ✓ | |
| 이메일 | ✓ | |
| 문의 분류 | ✓ | select: 멘토링/세션 진행/공동 프로젝트/기타 |
| 상세 메시지 | ✓ | max 2000 |

→ `inquiries(type='INDUSTRY', affiliation=회사명, subject=문의분류, ...)`.

### Form 3 — `/partners` 파트너십 신청 (신규)

위치: `/partners` ENGAGE 섹션 하단 + CTA 버튼.

| 필드 | 필수 | 비고 |
| --- | --- | --- |
| 회사명 | ✓ | partners.name |
| 카테고리 | ✓ | CORPORATE/CAPITAL/ACADEMIC |
| 한 줄 설명 | ✓ | one_liner |
| 회사 로고 | optional | ≤2MB → `partner-logos` |
| 신청자 이름 | ✓ | applicant_name |
| 신청자 이메일 | ✓ | applicant_email |
| 추가 메모 | optional | applicant_note |

→ `partners(status='pending', published=false)`. 승인 시 `published=true` 자동 토글.

### Form 4 — `/alumni` 알럼나이 등록 (신규, 통합)

위치: `/alumni`에 "알럼나이 등록하기" CTA → `/alumni/register` 별도 페이지.

**Section A — 알럼나이 정보 (필수)**

| 필드 | 비고 |
| --- | --- |
| 이름 | |
| 기수 | int 1~50 |
| 이메일 | admin only |
| 현재 활동/소속 | current_role |
| 한 줄 소개 | bio, max 200 |
| LinkedIn URL | optional |

**Section B — 본인 창업 회사 (토글, default OFF)**

토글 ON일 때만 노출, 모든 필드 필수:

| 필드 | 비고 |
| --- | --- |
| 회사명 | |
| 로고 | ≤2MB → `alumni-company-logos` |
| 한 줄 설명 | one_liner |
| 단계 | select: idea/seed/seriesA/seriesB/growth/exit |
| 회사 웹사이트 | optional |

→ 트랜잭션: `alumni` insert → 그 id를 `founder_alumni_id`로 `alumni_companies` insert. admin은 묶인 카드 1개로 봄.

### 새 모듈 구조

```
app/actions/
  ├─ inquiries.ts     # submitContactInquiry, submitIndustryInquiry
  ├─ partners.ts      # submitPartnerApplication
  └─ alumni.ts        # submitAlumniRegistration (트랜잭션)

components/forms/
  ├─ contact-form.tsx           # 기존 재사용, 서버 액션만 교체
  ├─ industry-inquiry-form.tsx
  ├─ partner-application-form.tsx
  └─ alumni-registration-form.tsx

emails/
  ├─ inquiry-notification.tsx
  ├─ partner-application-notification.tsx
  └─ alumni-registration-notification.tsx
```

---

## §4. Admin 페이지

### 라우트 구조

```
/admin/login                      Google OAuth
/admin                            대시보드 (대기 카운트)
/admin/applications               신청 큐 (alumni + partner 통합)
  /admin/applications/[type]/[id] 신청 상세 + 승인/거절
/admin/inquiries                  문의 목록 + 상태 토글
/admin/alumni                     승인된 알럼나이 (노출 토글)
/admin/partners                   승인된 파트너 (노출 토글)
```

### 미들웨어 (`middleware.ts`)

```
/admin/* 진입 시
  ├─ Supabase Auth getUser()
  ├─ 미로그인 → /admin/login 리다이렉트
  ├─ user.email ∈ admins.email ? 통과 : sign out + /admin/login?error=unauthorized
  └─ /admin/login 자체는 우회
```

`admins` 매칭은 service_role로 RPC (RLS 우회).

### 페이지별 UX

**`/admin` 대시보드** — 3개 카드: "대기 중 신청 N건" / "미처리 문의 N건" / "최근 활동". 각 카드 → 해당 페이지.

**`/admin/applications` 신청 큐** — 통합 테이블 (alumni + partner). 알럼나이 카드는 동반 회사 있으면 `(+회사 1)` 표기. 상세에서 두 row 같이 보여주고 **승인 한 번에 둘 다**. 거절은 사유 입력 → `status='rejected' reject_reason=...` (row 유지, 감사 추적).

**`/admin/inquiries`** — type 배지·이름·이메일·분류·상태·접수일. 행 클릭 → 메시지 펼침 + "회신" mailto 버튼.

**`/admin/alumni`, `/admin/partners`** — 승인된 행만. 컬럼: 요약 + **노출 토글**. 토글 OFF → `published=false` + revalidatePath. 편집 UI는 Phase 2.

### 디자인 톤

공개 사이트는 매거진 잡지 톤이지만 admin은 **utilitarian**. 같은 디자인 토큰(`bg-base`/`fg-primary`/`border`) 재사용하되 테이블·버튼 중심. 별도 `app/admin/layout.tsx`로 SiteNav/SiteFooter 제외, 좌측 admin sidebar.

### Server Action 카탈로그

```
app/admin/actions/
  applications.ts → approveAlumni(id), approvePartner(id),
                    rejectApplication(type, id, reason)
  inquiries.ts    → updateInquiryStatus(id, status)
  publish.ts      → toggleAlumniPublished(id), togglePartnerPublished(id)
```

승인 액션: `published=true` + `approved_at=now()` + `revalidatePath`. 거절: `status='rejected'` 유지 (감사 추적), 공개 페이지엔 RLS로 자동 미노출.

---

## §5. Email 알림

**Provider: Resend** (Next.js + Vercel 표준 조합, 무료 100통/일·3000통/월).

### 발신 도메인

| 단계 | from | 비고 |
| --- | --- | --- |
| MVP | `noreply@send.resend.dev` | 즉시 사용, 인증 불필요 |
| Phase 1.5 | `noreply@yonseivery.com` | Resend 대시보드 도메인 등록 → SPF/DKIM/DMARC DNS 3 레코드 |

MVP는 Resend 기본 도메인으로 시작해 도메인 verify를 운영 차단 요소로 만들지 않습니다.

### 템플릿 (React Email, 3종)

```
emails/
  inquiry-notification.tsx          # Form 1·2 공통 (type prop으로 분기)
  partner-application-notification.tsx
  alumni-registration-notification.tsx
```

공통 구조:

```
[VERY] 신규 ◯◯ 신청 — {요약 한 줄}
─────────────────────────────────
필드 1: 값
필드 2: 값
...
─────────────────────────────────
[ ADMIN에서 처리하기 → ]   ← 버튼

발송: 2026-05-24 14:33 KST · VERY 사이트
```

CTA → `/admin/applications/[type]/[id]` 또는 `/admin/inquiries`. **3 클릭 안에 처리** 목표.

### 발송 위치

Server Action 안에서 insert **직후** `await`. 실패해도 `throw` 없음 (`console.error`만) — DB insert는 이미 성공했고 admin이 큐에서 어차피 봄.

### 모듈

```
lib/email/
  client.ts          # 'server-only', Resend(process.env.RESEND_API_KEY)
  notifications.ts   # send* 함수 3개
```

---

## §6. 마이그레이션·배포 순서

**단일 PR로 한 번에 갈아끼움.** 중간 배포 사고 방지.

### 폐기 대상 (이번 PR에서 삭제)

```
lib/notion/                         (전체)
lib/server/site-config-cache.ts
app/actions/inquiries.ts            (재작성)
docs/notion-setup.md
.env.local NOTION_* 4줄 + Vercel
package.json @notionhq/client
```

### Phase별 작업

**Phase 1 — 인프라**
1. Supabase 프로젝트 생성
2. 6개 테이블 + 2개 Storage 버킷 + RLS 마이그레이션 SQL
3. `admins` 첫 행 insert (회장 이메일)
4. Resend 계정 + API 키
5. `.env.local`·Vercel에 4개 env 등록

**Phase 2 — 공개 페이지 읽기 마이그레이션**
6. `lib/supabase/server.ts`, `lib/supabase/browser.ts` (SSR 클라이언트)
7. `lib/data/partners.ts`, `lib/data/site-config.ts`, `lib/data/alumni.ts` (select 함수)
8. `partners/page.tsx`, 홈 `page.tsx`, `site-footer.tsx` 호출부 교체
9. `lib/notion/*`, `lib/server/site-config-cache.ts` 삭제

**Phase 3 — 폼 + Server Actions**
10. `app/actions/inquiries.ts` 재작성
11. `app/actions/partners.ts`, `app/actions/alumni.ts` 신규
12. Form 컴포넌트 4개 (Form 1은 액션만 교체)
13. 페이지에 폼 마운트
14. Resend 템플릿 3종 + `lib/email/*`

**Phase 4 — Admin**
15. `middleware.ts` (admin 인증)
16. `/admin/login`, `/admin/layout.tsx`
17. `/admin` 대시보드 + `/admin/applications` 큐 + 상세 + 승인/거절
18. `/admin/inquiries`, `/admin/alumni`, `/admin/partners`

**Phase 5 — 종단 검증 + 배포**
19. 로컬 `npm run build` 통과
20. develop preview → 4개 폼 종단 테스트 (제출→DB→메일→admin 승인→공개 반영)
21. main fast-forward
22. PROGRESS.md 갱신, Vercel에서 NOTION_* 제거

### 배포 위험·롤백

- Phase 1~3 진행 중엔 develop만 push, main 안 건드림 (빌드 실패 가능)
- main 배포 직전 NOTION_* env는 무해 (코드가 더 이상 참조 안 함). 안전을 위해 직후 Vercel 대시보드에서 제거
- 롤백: 단일 PR, `git revert` 1회

---

## 결정 기록

| # | 결정 | 이유 |
| --- | --- | --- |
| 1 | Supabase 풀 전환 | 로고 업로드·승인 워크플로·다수 폼이 Notion 약점 영역. Postgres+Storage+Auth+Edge가 한 곳에서 자연스러움 |
| 2 | 알럼나이+회사 한 폼 통합 | 한 사람 평생 1~2번 등록. 임원진 승인 1회. 데이터 무결성 |
| 3 | 임원진 개인 Gmail 화이트리스트 | 비밀번호 공유 사고 방지. 누가 승인했는지 감사 가능. 인수인계가 admins 테이블 갱신 의식 |
| 4 | 백엔드 먼저, 카피 나중 | 새 기능 임팩트가 큼. 카피 리라이트는 페이지별 톤 통일 작업이라 한 호흡 |
| 5 | MVP에서 발신 도메인 미검증 | 도메인 verify가 운영 차단 요소가 되지 않게. 수신 영향 미미 |
| 6 | 거절 row 보존 | 감사 추적. RLS로 자동 미노출 |
| 7 | 단일 PR 마이그레이션 | 중간 사고 방지. 롤백 단순 |
