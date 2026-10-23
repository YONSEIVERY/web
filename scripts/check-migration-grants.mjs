// 빌드 가드: 0037부터의 마이그레이션이 만드는 public 테이블에 service_role
// GRANT가 없으면 실패시킨다.
// 근거: 2026-10-30부터 Supabase는 기존 프로젝트라도 public에 새로 만든 테이블에
// Data API 권한을 자동으로 주지 않는다(9/24 공지). 서버는 거의 전부 service_role로
// 읽고 쓰므로 GRANT가 빠지면 배포 뒤 permission denied로 깨진다.
// anon·authenticated는 정책이 있어야 하는 테이블에만 따로 준다. PII 테이블은
// 주지 않는다(0026·0027·0031처럼 service_role 전용). package.json build에서 실행.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS_DIR = 'supabase/migrations'
// 0036까지는 자동 GRANT 시절에 만들어져 이미 권한이 붙어 있다.
const FIRST_CHECKED = 37

const missing = []
for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
  if (Number.parseInt(file, 10) < FIRST_CHECKED) continue
  const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
  const created = sql.matchAll(
    /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_]+)/gi,
  )
  for (const [, table] of created) {
    const granted = new RegExp(
      `\\bgrant\\s[^;]*\\bon\\s+(?:table\\s+)?public\\.${table}\\b[^;]*\\bto\\s[^;]*\\bservice_role\\b`,
      'i',
    )
    if (!granted.test(sql)) missing.push({ file, table })
  }
}

if (missing.length === 0) {
  console.log('마이그레이션 GRANT 확인: 누락 없음')
  process.exit(0)
}

console.error('\nservice_role GRANT가 없는 새 테이블이 있습니다.')
console.error('2026-10-30부터 새 테이블은 GRANT 없이는 Data API로 닿지 않습니다.')
console.error('테이블을 만드는 같은 마이그레이션에 아래 문장을 넣으십시오.\n')
for (const { file, table } of missing) {
  console.error(`  ${file}`)
  console.error(`  grant select, insert, update, delete on public.${table} to service_role;\n`)
}
process.exit(1)
