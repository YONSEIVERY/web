# 알럼나이 후원자 명단(명예의 전당) 설계

작성일: 2026-07-07
대상: `/alumni` 하단 신규 섹션 + `/admin/sponsors` 어드민

## 배경

VERY 데모데이의 상금·운영자금을 후원해 준 개인·기업을
알럼나이 페이지에 명예의 전당 형태로 노출한다. 금액은 노출하지
않는다(명예 목적, 품위 유지). 회차별 후원 이력을 향후 축적하기
위해 자유 텍스트 라벨을 함께 둔다.

## 데이터 모델

신규 테이블 `public.sponsors`:

- `id uuid` primary key
- `name text` 표시명 (익명 지원: name = '익명')
- `kind text check ('individual','company')` 개인/기업
- `category text check ('prize','operations')` 데모데이 상금 / 운영자금
- `cohort_label text nullable` 예: "VOL.42 데모데이", "43기 운영"
- `note text nullable` 짧은 메시지·소감
- `order_index int not null default 0` 표시 순서 (작을수록 위)
- `created_at timestamptz`, `updated_at timestamptz`

인덱스: `(category, order_index, created_at desc)`.

RLS:
- SELECT 공개 (`for select using (true)`)
- INSERT/UPDATE/DELETE 는 service_role 경유 (어드민 서버 액션)

## UI — 마케팅

`/alumni` 하단에 새 섹션 `HALL OF HONOR`.

- 라벨: `HALL OF HONOR` (mono) + 제목 `명예의 전당.`
- 서브섹션 두 개 병치:
  - 데모데이 상금 후원 (category = 'prize')
  - 운영자금 후원 (category = 'operations')
- 각 서브섹션은 카드 그리드(모바일 1열, md+ 2~3열).
- 카드 구성:
  - name (font-display bold)
  - kind 라벨 (mono uppercase, INDIVIDUAL / COMPANY)
  - cohort_label (있으면)
  - note (있으면, 짧은 텍스트)
- 카테고리에 항목이 하나도 없으면 서브섹션 자체를 렌더하지 않는다.

## 어드민

`/admin/sponsors`:
- 목록: name · kind · category · cohort_label · order_index
- 신규/편집 폼: 위 필드 전체 + delete
- 목록 정렬: `(category asc, order_index asc, created_at desc)`

기존 `alumni`·`partners` 어드민 페이지 패턴 그대로 복제.
`requireAdmin()` 가드 + `supabaseService`로 mutation.

## 마이그레이션 순서

1. `supabase/migrations/0007_sponsors.sql` 파일 커밋
2. prod DB에는 Supabase MCP `execute_sql`로 즉시 반영
3. seed 데이터는 우선 없이 비운 상태로 배포 → 어드민에서 실데이터 입력

## 미래 확장 여지

- 후원 회차 표기가 정형화되면 `cohort_label text` → `demoday_event_id uuid`
  참조로 마이그레이션할 수 있다. 지금은 자유 텍스트로 시작해 UX
  피로도를 줄인다.
- 기업 로고는 별도 컬럼(`logo_url`) + Storage bucket으로 향후 확장.
- 금액은 계속 노출하지 않는다.
