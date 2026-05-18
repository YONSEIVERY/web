# yonseivery.com — Design Document

**Date**: 2026-05-19
**Owner**: VERY 43기 회장단 (회장 신현우, 부회장 구원근)
**Domain**: `yonseivery.com` (Vercel)
**Tone reference**: instagram.com/very_yonsei

---

## 1. Goals & Non-Goals

### Goals
1. **External branding** — 협력사·산학협력 파트너에게 VERY 정체성 전달
2. **Activity archive** — 세션·데모데이·창업팀 결과물의 누적 기록
3. **Member showcase** — 기수별 멤버 + 알럼나이 스타트업 강조

### Non-Goals (v1 범위 밖)
- 신입 부원 모집을 위한 자체 지원 폼 (구글폼 외부 링크로 충분)
- 다국어 (한글 단일, 영문은 디자인 액센트로만)
- 알럼나이 개인 상세 페이지, 검색, 댓글, 다크/라이트 토글, 회원 전용 영역

---

## 2. Brand Identity (from Instagram + design assets)

### Color tokens
```
--color-bg-base:    #000000        # 배경
--color-bg-elev:    #0A0A0F        # 카드/엘리베이션
--color-fg-primary: #FFFFFF        # 본문
--color-fg-muted:   #6B7280        # 서브 텍스트
--color-accent:     #3A4FF0        # VERY 블루 (로고 색상 추출 후 확정)
--color-accent-2:   #818CF8        # 밝은 블루
--gradient-hero:    radial-gradient(at top, #3A4FF0, #000000)
```

### Typography
- 영문 디스플레이: Geist / Inter / Pretendard (이탤릭 활용 — `lander`, `settler`, `fail forward`)
- 한글 본문: Pretendard Variable
- 모노: Geist Mono (코드/숫자/태그용)

### Motion
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — sharp slow-in
- 스태거 진입, 스크롤-연동 패럴랙스 (히어로), hover-tilt (카드)
- 글로벌 SVG 노이즈 오버레이 4% opacity — 영화 그레인 질감

### Available brand assets
- `/design/logo_-02.png` — wing-V 로고 (white, 8000×4500)
- `/design/Artboard 7-9.png` — 그라데이션/타이포 무드 보드
- 인스타 그리드 사진 — 세션·데모데이 다큐 사진 (학회 원본 폴더 별도 수령 예정)

---

## 3. Information Architecture (8 pages)

| 경로 | 페이지 | 핵심 콘텐츠 |
|---|---|---|
| `/` | Home | Hero, Manifesto, Core Value, Numbers, 최근 활동, 알럼나이 쇼케이스, CTA |
| `/about` | About | Who We Are, Vision, K·E·N 풀스크린, For VERY Members |
| `/curriculum` | Curriculum | 기수 셀렉터 + 주차별 타임라인 (노션 DB) |
| `/demoday` | Demoday | 창업팀 갤러리, 수상내역, 연사·심사위원 (노션 DB) |
| `/alumni` ★ | Alumni | 알럼나이 스타트업 그리드 + 분야·기수 필터 (노션 DB) |
| `/partners` | Partners | 협력사 로고월, 산학협력 케이스 카드 |
| `/recruit` | Recruit | 시즌 게이트 (모집 중 / 마감) + 외부 구글폼 |
| `/contact` | Contact | 이메일, 인스타, 간단 문의 폼 |

---

## 4. Tech Stack & Approach

**A안 (확정)**: Next.js 15 (App Router) + Tailwind v4 + Notion API + Framer Motion + Vercel

- **렌더링**: SSG + ISR (60초 재검증) for Notion-backed pages
- **타입스크립트**: 엄격 모드, `tsc --noEmit` CI 차단
- **콘텐츠 분리** (Hybrid CMS):
  - 코드: Hero 카피, Manifesto, Vision, Core Value, 협력사, 통계 숫자
  - 노션 DB: 커리큘럼, 알럼나이 스타트업, 수상내역, 창업팀
  - 환경 변수: `RECRUIT_OPEN` 시즌 토글

---

## 5. Component Catalog

### Primitives
`Button` · `Tag` · `NoiseLayer` · `GlowBackground` · `SectionHeader` · `Divider`

### Layout
`Nav` (고정 상단, 스크롤 시 블러) · `Footer` · `PageHero` · `Section`

### Content blocks
`ManifestoBlock` · `CoreValueCard` · `NumberStat` · `TimelineRail` · `CurriculumCard` · `TeamCard` · `AlumniStartupCard` · `LogoMarquee` · `PartnerLogoGrid` · `CaseStudyCard` · `FilterBar` · `SeasonGate`

### Notion data components
`CurriculumList` · `AlumniGrid` · `AwardsTimeline` · `TeamsGallery`

### Motion helpers
`Reveal` (IntersectionObserver 스태거) · `TiltCard` · `CountUp` · `MagneticLink`

---

## 6. Data Flow (Notion ↔ Site)

```
[학회 임원이 노션 편집]
        │
        ▼
[Notion API] ──► Next.js Server Component ──► [ISR 60s] ──► [CDN] ──► [방문자]
```

### Notion side prerequisites
1. Internal Integration 생성 → 토큰 발급
2. 각 DB에 Integration "Add connection"
3. DB 스키마 컨벤션 합의 (컬럼명 고정)
4. 이미지 정책: 로고는 png/svg, 사진은 webp

### Notion DB → 타입 매핑
- `parseAlumniStartup(page)` → `AlumniStartup { name, founder, cohort, category, logoUrl, link }`
- `parseCurriculum(page)` → `CurriculumWeek { cohort, week, topic, speaker, date, keywords, photoUrl? }`
- `parseAward(page)` → `Award { alumniName, cohort, award, year, organization }`
- `parseTeam(page)` → `Team { cohort, name, members, oneLiner, output? }`

### Secrets (Vercel env, server-only)
- `NOTION_TOKEN`
- `NOTION_DB_CURRICULUM_43`, `NOTION_DB_CURRICULUM_42`
- `NOTION_DB_ALUMNI`, `NOTION_DB_AWARDS`, `NOTION_DB_TEAMS`
- `RECRUIT_OPEN` (`true` | `false`)
- `CONTACT_FORM_TO_EMAIL=yonseivery1997@gmail.com`

`NEXT_PUBLIC_` 프리픽스 금지 — 클라이언트 번들 노출 방지.

### Cache & revalidation
- 페이지 레벨: `export const revalidate = 60`
- 즉시 반영 필요 시: `/api/revalidate?path=/curriculum` (관리자용, 시크릿 키 검증)

---

## 7. Error Handling

| 시나리오 | 처리 |
|---|---|
| 노션 API 다운 | 마지막 ISR 캐시 유지, 페이지 정상 표시 |
| DB 스키마 변경 | 파서가 안전 기본값 반환 + Sentry 워닝 |
| 노션 이미지 URL 만료 | `next/image` `onError` → wing-V placeholder |
| 빌드 타임 페칭 실패 | 정적 셸만 빌드, 런타임 ISR로 재시도 |
| Contact 폼 전송 실패 | "yonseivery1997@gmail.com 으로 직접" 안내 |
| 시즌 외 RECRUIT 직링크 | "다음 모집 알림 받기" 자동 분기 |
| 404 / 500 | `not-found.tsx` / `error.tsx` 시네마틱 폴백 |

---

## 8. Testing & QA

- **CI**: `tsc --noEmit`, `eslint`, `next build` 통과 필수
- **유닛 테스트**: 노션 파서 (`parseAlumniStartup` 등) — 스키마 변경 즉시 감지
- **Lighthouse CI**: 성능·접근성 90+ 유지
- **수동 QA 체크리스트**: 8개 페이지 × 데스크탑/모바일 1회
- **풀커버리지 컴포넌트 테스트, E2E 자동화는 의도적으로 제외 (YAGNI)**

### Accessibility
- 시맨틱 HTML, WCAG AA 색 대비, 블루 포커스 링, alt 텍스트
- 키보드 내비게이션, prefers-reduced-motion 존중

---

## 9. Deployment

- **Vercel** GitHub 연동 자동 배포
- **브랜치**:
  - `main` → Production (`yonseivery.com`)
  - `develop` → Preview
  - PR마다 자동 Preview URL
- **도메인**: `yonseivery.com` + `www.yonseivery.com` (www → root 리다이렉트)
- **환경 변수**: Production / Preview / Development 분리
- **OG 이미지**: `/api/og` 동적 생성 (제목 + wing-V + 블루 글로우)
- **Analytics**: Vercel Analytics (privacy-friendly)

---

## 10. Privacy

- 회장단 휴대폰 번호 **노출 없음** (노션엔 있지만 공개 사이트 비공개)
- 학회 공식 이메일만 노출: `yonseivery1997@gmail.com`
- 노션 토큰·DB ID는 서버 전용 환경 변수
- 알럼나이 개인정보(연락처)는 사이트에 노출하지 않음

---

## 11. Timeline (estimated)

| 단계 | 기간 |
|---|---|
| 0. 셋업 (Next 15 + Tailwind + Vercel + 도메인) | 0.5d |
| 1. 디자인 시스템 + Nav/Footer | 1d |
| 2. Home + About | 1~1.5d |
| 3. Notion 연동 인프라 | 0.5d |
| 4. Curriculum + Demoday | 1d |
| 5. Alumni + Partners | 1d |
| 6. Recruit + Contact | 0.5d |
| 7. 모션 / 마이크로 폴리시 | 0.5~1d |
| 8. QA + 배포 | 0.5d |
| **Total** | **6~7d (풀타임 기준)** |

---

## 12. v2 Backlog (out of scope)

- 알럼나이 개인 상세 페이지
- 검색
- 블로그/뉴스 섹션
- 이메일 뉴스레터 (Resend + 노션 구독자 DB)
- 다국어 (영문)
- 회원 전용 영역 (알럼나이 톡방 게이트)

---

## 13. Open Questions

1. **노션 Integration 토큰 발급** — 회장단이 직접 발급 후 공유 필요
2. **세션/데모데이 원본 사진 폴더** — `/design`에는 로고/타이포만, 사람 사진 별도 폴더 필요
3. **로고 색상 픽셀 헥스 추출** — `#3A4FF0`은 추정치, 로고 원본에서 정확값 확정 필요
4. **알럼나이 스타트업 로고** — 노션에 업로드되어 있는지, 별도 수집이 필요한지
5. **Recruit 시즌 시작 시점** — 43기 모집은 이미 진행 중 → `RECRUIT_OPEN=true`로 v1 출시?

---

## 14. Approval

본 디자인은 2026-05-19 브레인스토밍 세션에서 8회의 Q&A를 통해 합의되었으며, 작성자가 다섯 개 섹션을 단계별 승인받음. 다음 단계는 `superpowers:writing-plans` 스킬을 통한 구현 플랜 작성.
