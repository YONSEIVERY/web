// 빌드 가드: 마이그레이션에 있는 public 테이블이 백업 목록에서 빠지면 실패시킨다.
// 근거: Supabase Free 플랜에는 자동 백업이 없다. 백업 목록 누락은 조용히
// 일어나고 사고가 난 뒤에야 드러난다. package.json build에서 실행.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS_DIR = 'supabase/migrations'
const BACKUP_FILE = 'lib/portal/backup.ts'

// 백업하지 않아도 되는 테이블. 이유를 반드시 적는다.
const EXEMPT = new Map([
  ['audit_log', '백업 대상이 아니라 백업을 검증하는 기록이다. 덤프에 넣으면 복원 시 과거 감사 기록을 덮어쓴다'],
])

const sqlText = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'))
  .join('\n')

// 생성과 삭제를 순서대로 적용해 현재 존재하는 집합을 구한다.
const live = new Set()
const stmt = /\b(create|drop)\s+table\s+(?:if\s+(?:not\s+)?exists\s+)?public\.([a-z_]+)/gi
for (const m of sqlText.matchAll(stmt)) {
  const verb = m[1].toLowerCase()
  if (verb === 'create') live.add(m[2])
  else live.delete(m[2])
}

const backupSrc = readFileSync(BACKUP_FILE, 'utf8')
const listed = new Set(
  [...backupSrc.matchAll(/^\s*'([a-z_]+)',$/gm)].map((m) => m[1]),
)

const missing = [...live].filter((t) => !listed.has(t) && !EXEMPT.has(t))
const stale = [...listed].filter((t) => !live.has(t))

if (missing.length === 0 && stale.length === 0) {
  console.log(`백업 목록 정합 확인: ${listed.size}개 테이블`)
  process.exit(0)
}

if (missing.length > 0) {
  console.error('\n백업 목록에 빠진 테이블이 있습니다.')
  console.error(`${BACKUP_FILE}의 BACKUP_TABLES에 추가하십시오.`)
  for (const t of missing) console.error(`  - ${t}`)
  console.error('\n백업하지 않기로 한 것이라면 같은 파일이 아니라')
  console.error('scripts/check-backup-tables.mjs의 EXEMPT에 이유와 함께 넣으십시오.')
}

if (stale.length > 0) {
  console.error('\n백업 목록에 없는 테이블이 남아 있습니다 (드롭된 테이블).')
  for (const t of stale) console.error(`  - ${t}`)
}

process.exit(1)
