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
  'member_intros',
  'member_signups',
  'notices',
  'partners',
  'recruit_rounds',
  'session_posts',
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
    const { data, error } = await supabaseService
      .from(table)
      .select('*')
      .returns<Record<string, unknown>[]>()

    if (error) {
      console.error('[backup-portal] dump failed', table, error)
      failed.push({ table, message: error.message })
      continue
    }
    const rows = data ?? []
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
