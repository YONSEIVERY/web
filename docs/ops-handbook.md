# VERY 웹 운영 핸드북 (44기 → 45기 인수인계 겸용)

작성 2026-08-04 · 기준 커밋 main. 시즌 운영자와 차기 인수자가 이 문서 하나로
전체 구조를 파악하는 것이 목적이다.

## 1. 계정 체계 (인수인계의 전부)

모든 인프라가 학회 계정으로 통일되어 있다. **45기 인수인계 = 학회 Gmail +
학회 GitHub 계정 인계로 끝난다.**

| 서비스 | 계정 | 역할 |
|---|---|---|
| Gmail | yonseivery1997@gmail.com | 마스터 키. 알림 수신, 각 서비스 로그인 |
| GitHub | yonseivery1997-cmyk (org YONSEIVERY) | 저장소 web, Vercel 연동 |
| Vercel | 학회 Gmail 가입 | 호스팅, 도메인 yonseivery.com(자동갱신 2027-05), 환경변수, 애널리틱스 |
| Supabase | 학회 GitHub OAuth | 프로젝트 very-yonseivery (서울 리전), DB·스토리지·인증 |
| Resend | 학회 Gmail 가입 | 메일 발송. yonseivery.com 도메인 인증됨, 발신 noreply@ |

- 어드민 화이트리스트: `admins` 테이블 (마이그레이션 0019 참고). 추가·제거는 Supabase SQL Editor.
- 배포: main 브랜치 push = 자동 배포. develop 브랜치는 폐기된 노션 시절 코드라 사용 금지.

## 2. 시즌 운영 절차 (반복 작업)

**모집 시즌 (매 학기 초)**
1. `recruit_rounds`에 새 라운드 삽입 (`is_current=true`, 마감 `apply_deadline` KST로), `site_config`의 cohort·semester 갱신, `lib/content/recruit.ts` 일정 카피 수정
2. 지원서 양식 파일 교체: `public/downloads/very44-application.docx` (파일명·다운로드명은 recruit.ts)
3. 접수 열기: /admin/recruit 토글. 마감은 apply_deadline이 자동 차단
4. 심사: 상태 저장 → "결과 통보" 버튼으로 서류·최종 단계별 일괄 발송 (0020의 발송 기록 컬럼이 중복 발송을 차단)
5. 합격자 확정 후: 어드민 학회원 메뉴에서 새 기수 명단 등록 (**이메일 필수**, 포털 로그인 자격). 등록 즉시 포털 멤버 디렉토리·자기소개 자동 오픈

**데모데이 시즌 (매 학기 말)**
- /admin/demoday에서 새 회차 생성 (is_current 이동), 참관 신청 토글. 행사일이 지나면 사이트가 자동으로 종료 상태(ENDED) 처리

**기수 전환 체크리스트**
- site_config 갱신, 신규 recruit_rounds, admins 화이트리스트 교체, 지원서 양식 교체, STATS.cohorts(lib/content/site.ts) 갱신, 데모데이 회차 생성

## 3. 데이터·보안 불변식 (건드리지 말 것)

- 모든 테이블 읽기·쓰기는 서버(service_role) 경유. **anon 정책을 새로 열지 않는다** (0018에서 PII 노출 통로를 전부 닫았음. 익명 REST로 이메일·전화가 노출된 사고 이력 있음)
- `applications`·`member_intros`·PII 테이블은 RLS 정책 0개(전면 차단)가 정상 상태
- `recruit-applications` 버킷은 private + 서명 URL만. 업로드는 서명 티켓(4.5MB 서버 한도 우회 설계)
- 지원서 자료는 모집 종료 후 1년 뒤 파기 (개인정보처리방침 /privacy에 공개된 약속. 매년 여름 정리)
- 개인정보 수집 항목·보유기간을 바꾸면 /privacy(lib/content/privacy.ts)와 각 폼 동의문을 함께 갱신

## 4. 메일

- 발신: noreply@yonseivery.com (Resend 도메인 인증, DNS는 Vercel에 등록됨)
- 운영진 알림(접수·문의·신청) → 학회 Gmail. 지원자 접수 확인·결과 통보 → 지원자에게 자동 발송
- 알림이 끊기면: Resend Domains 인증 상태 → Vercel 환경변수 RESEND_API_KEY 순으로 확인

## 5. 마이그레이션 이력 (운영 DB 적용 완료: 0001~0020)

핵심만: 0011 학회원 명단 / 0013 리크루팅 / 0014 학회원 포털 / 0016 첨부 확장 /
0017 자기소개 / 0018 RLS 하드닝 / 0019 어드민 화이트리스트 / 0020 결과 통보 기록.
새 마이그레이션은 파일 추가 후 Supabase SQL Editor에서 수동 실행한다.

## 6. 알려진 사항·백로그

- 자동화 브라우저에서 서버 액션 POST가 간헐 503 (실사용자 영향 보고 없음. 제보 시 Vercel 방화벽 의심)
- portal_role RPC가 익명 호출 가능 (이메일 등록 여부만 노출, 위험도 낮음. 여유 있을 때 authenticated 한정 검토)
- 8/23 마감 후: 상단 탭 구조 재논의, /recruit 페이지 정렬을 중앙 레이아웃에 맞추기
- 개강 후: 소모임·조별 과제 구조는 수요 확인 후 결정
