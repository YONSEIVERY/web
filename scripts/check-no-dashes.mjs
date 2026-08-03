// 빌드 가드: 소스에 em/en dash 및 유사 대시 문자가 들어오면 빌드를 실패시킨다.
// 근거: 표기 원칙(라벨 구분 ·, 범위 ~, 그 외 하이픈). package.json build에서 실행.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const BANNED = /[—–─―]/ // — – ─ ―
const ROOTS = ['app', 'lib', 'components', 'emails', 'middleware.ts']
const EXTS = new Set(['.ts', '.tsx', '.css', '.md'])

const offenders = []

function walk(path) {
  const st = statSync(path)
  if (st.isDirectory()) {
    for (const entry of readdirSync(path)) walk(join(path, entry))
    return
  }
  if (!EXTS.has(extname(path))) return
  const text = readFileSync(path, 'utf8')
  if (!BANNED.test(text)) return
  text.split('\n').forEach((line, i) => {
    if (BANNED.test(line)) offenders.push(`${path}:${i + 1}: ${line.trim().slice(0, 80)}`)
  })
}

for (const root of ROOTS) {
  try {
    walk(root)
  } catch {
    // 루트가 없으면 무시
  }
}

if (offenders.length > 0) {
  console.error('\n[check-no-dashes] 금지 대시 문자(— – ─ ―) 발견. 하이픈(-)/가운뎃점(·)/물결(~)로 바꾸세요:\n')
  for (const line of offenders.slice(0, 40)) console.error('  ' + line)
  if (offenders.length > 40) console.error(`  ...외 ${offenders.length - 40}건`)
  process.exit(1)
}
console.log('[check-no-dashes] OK')
