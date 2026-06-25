-- supabase/seed.sql
-- 학회 운영진 화이트리스트와 site_config 첫 행 (idempotent)

insert into public.admins (email, name) values
  ('ricky7@yonsei.ac.kr', '회장')   -- 사용자 본인 (필요 시 추가 임원진 append)
on conflict (email) do nothing;

insert into public.site_config (key, cohort, year, semester, since_year) values
  ('current', 43, 2026, '1학기', 1997)
on conflict (key) do nothing;

-- ============================================================
-- 데모데이 회차 시드. 현 회차(43기)는 is_current=true, register_open=false.
-- 어드민이 포스터 업로드 후 register_open=true로 토글하면 /demoday에 신청
-- 버튼이 노출된다. 과거 회차(42·41)는 CLOSED 상태로 무대 기록만 보관.
-- form_choices·schedule은 jsonb라 어드민에서 코드 배포 없이 수정 가능.
-- ============================================================
insert into public.demoday_events
  (volume, semester, is_current, register_open, event_date, event_end_date, location, location_note, intro_text, schedule, form_choices)
values
  (
    43,
    '1학기',
    true,
    false,
    '2026-07-18 14:00:00+09'::timestamptz,
    '2026-07-18 18:00:00+09'::timestamptz,
    '티오더 사옥',
    '서울시 영등포구 여의대로 108, 파크원 타워2, 46층',
    '학기의 마지막 무대. 한 학기 동안 다진 프로젝트를 CEO·VC 심사역 앞에 올려, 평가와 투자로 이어 나가는 자리.',
    '[
       {"time":"13:30","label":"등록 및 입장"},
       {"time":"14:00","label":"개회 및 개회사"},
       {"time":"14:10","label":"키노트 강연"},
       {"time":"14:35","label":"1부 진행 안내"},
       {"time":"14:40","label":"[1부] 액팅 발표 — 8팀"},
       {"time":"15:52","label":"휴식 및 네트워킹"},
       {"time":"16:10","label":"2부 진행 안내"},
       {"time":"16:15","label":"[2부] 알럼나이 IR — 4팀"},
       {"time":"16:51","label":"인기상 투표 마감 · 심사 집계"},
       {"time":"17:15","label":"시상식"},
       {"time":"17:45","label":"폐회사"},
       {"time":"17:55","label":"마무리 및 정리"}
     ]'::jsonb,
    '{
       "purposes":[
         "IR 피칭 직접 보기",
         "학회 동문 · 팀과 네트워킹",
         "VC · CEO 심사역의 시선",
         "연세대 창업 문화 견학",
         "기타"
       ],
       "roles":[
         "학부생",
         "대학원생",
         "재직자",
         "VC · 심사역",
         "CEO · 창업가",
         "교수 · 교직원",
         "기타"
       ],
       "sources":[
         "VERY 인스타그램",
         "학회원 · 동문 추천",
         "학교 공지",
         "검색",
         "기타"
       ]
     }'::jsonb
  ),
  (
    42,
    '2학기',
    false,
    false,
    '동문·외부 청중과 함께 마무리한 직전 데모데이.',
    '[]'::jsonb,
    '{}'::jsonb
  ),
  (
    41,
    '1학기',
    false,
    false,
    '학회가 매 학기 다져온 누적의 무대.',
    '[]'::jsonb,
    '{}'::jsonb
  )
on conflict (volume, semester) do nothing;

-- ============================================================
-- 위 INSERT가 이미 한번 실행된 환경에서는 do nothing으로 변경분이 안 들어간다.
-- 그래서 현 회차(43기)의 PDF 행사계획서 기반 필드를 명시적으로 UPDATE해 둔다.
-- (재실행해도 동일한 값으로 idempotent)
-- ============================================================
update public.demoday_events set
  event_date = '2026-07-18 14:00:00+09'::timestamptz,
  event_end_date = '2026-07-18 17:50:00+09'::timestamptz,
  location = '티오더 사옥',
  location_note = '서울시 영등포구 여의대로 108, 파크원 타워2, 46층',
  schedule = '[
     {"time":"14:00-14:10","label":"오프닝"},
     {"time":"14:10-14:35","label":"키노트 스피치"},
     {"time":"14:35-15:10","label":"IR 피칭 1부"},
     {"time":"15:10-15:25","label":"인터미션 (부스 운영)"},
     {"time":"15:25-16:00","label":"IR 피칭 2부"},
     {"time":"16:00-16:15","label":"인터미션 (부스 운영)"},
     {"time":"16:15-16:50","label":"IR 피칭 3부"},
     {"time":"16:50-17:10","label":"최종 심사 및 시상"},
     {"time":"17:10-17:50","label":"자율 네트워킹"}
   ]'::jsonb,
  updated_at = now()
where volume = 43 and semester = '1학기';
