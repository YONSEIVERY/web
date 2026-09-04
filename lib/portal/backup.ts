import 'server-only'
import { supabaseService } from '@/lib/supabase/service'

/**
 * 전수 백업 대상 테이블.
 *
 * Supabase Free 플랜에는 자동 백업이 없다. 공식 문서도 Free 프로젝트는
 * 직접 export해 외부에 보관하라고 안내한다. 즉 이 목록이 사고 시
 * 되돌릴 수 있는 유일한 지점이다.
 *
 * 새 테이블을 만들고 여기에 추가하지 않으면 그 테이블은 조용히
 * 백업되지 않는다. 그래서 `scripts/check-backup-tables.mjs`가 빌드에서
 * 마이그레이션과 이 목록을 대조해 누락을 막는다. 목록을 고칠 때는
 * 그 가드가 함께 통과하는지 확인할 것.
 */
export const BACKUP_TABLES = [
  'admins',
  'alumni',
  'alumni_companies',
  'applications',
  'attendance',
  'club_sessions',
  'cohort_members',
  'demoday_attendees',
  'demoday_events',
  'inquiries',
  'intro_comments',
  'member_intros',
  'member_signups',
  'notices',
  'partners',
  'recruit_rounds',
  'session_materials',
  'session_posts',
  'session_submissions',
  'site_config',
  'sponsors',
] as const

export type BackupTable = (typeof BACKUP_TABLES)[number]

export type TableDump = {
  rows: Record<string, unknown>[]
  count: number
}

export type PortalDump = {
  takenAt: string
  tables: Record<string, TableDump>
  totalRows: number
  failed: { table: string; message: string }[]
}

/**
 * 한 번에 가져오는 행 수. Supabase(PostgREST)는 요청당 기본 1000행에서
 * 자르고 오류를 내지 않는다. 페이지네이션이 없으면 덤프가 조용히 잘린다.
 * 잘린 백업은 백업이 아니다.
 */
const PAGE = 1000

/** 무한 루프 방지. 이 저장소 규모에서 100만 행은 도달할 수 없는 수다. */
const MAX_PAGES = 1000

/**
 * 페이지 경계가 흔들리지 않도록 정렬 키를 고정한다. 정렬 없이 range로
 * 나눠 읽으면 중간에 행이 들어오고 나갈 때 같은 행을 두 번 받거나
 * 통째로 놓칠 수 있다. 대부분 id지만 기본키가 다른 두 테이블이 있다.
 */
const ORDER_BY: Record<BackupTable, string> = {
  admins: 'id',
  alumni: 'id',
  alumni_companies: 'id',
  applications: 'id',
  attendance: 'id',
  club_sessions: 'id',
  cohort_members: 'id',
  demoday_attendees: 'id',
  demoday_events: 'id',
  inquiries: 'id',
  intro_comments: 'id',
  member_intros: 'member_id',
  member_signups: 'id',
  notices: 'id',
  partners: 'id',
  recruit_rounds: 'id',
  session_materials: 'id',
  session_posts: 'id',
  session_submissions: 'id',
  site_config: 'key',
  sponsors: 'id',
}

/**
 * 모든 대상 테이블을 통째로 읽어 하나의 객체로 만든다.
 *
 * 한 테이블이 실패해도 나머지를 포기하지 않는다. 백업이 전부 아니면
 * 무(無)가 되는 구조는 사고 당일에 가장 쓸모가 없다. 실패는 failed에
 * 남겨 호출부가 경고를 띄우게 한다.
 */
export async function buildPortalDump(): Promise<PortalDump> {
  const tables: Record<string, TableDump> = {}
  const failed: { table: string; message: string }[] = []
  let totalRows = 0

  for (const table of BACKUP_TABLES) {
    const rows: Record<string, unknown>[] = []

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE
      const { data, error } = await supabaseService
        .from(table)
        .select('*')
        .order(ORDER_BY[table], { ascending: true })
        .range(from, from + PAGE - 1)
        .returns<Record<string, unknown>[]>()

      if (error) {
        console.error('[backup-portal] dump failed', table, error)
        failed.push({ table, message: error.message })
        break
      }
      const batch = data ?? []
      rows.push(...batch)
      if (batch.length < PAGE) break
      if (page === MAX_PAGES - 1) {
        // 여기 닿았다면 PAGE * MAX_PAGES 행을 넘었다는 뜻이다.
        // 조용히 자르지 않고 실패로 올린다.
        failed.push({
          table,
          message: `행 수가 ${PAGE * MAX_PAGES}를 넘어 덤프가 잘렸습니다.`,
        })
      }
    }

    // 실패한 테이블도 받은 만큼은 남긴다. 부분 사본이 없는 것보다 낫다.
    tables[table] = { rows, count: rows.length }
    totalRows += rows.length
  }

  return {
    takenAt: new Date().toISOString(),
    tables,
    totalRows,
    failed,
  }
}
