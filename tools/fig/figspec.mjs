import { readFileSync } from 'node:fs'

const nodes = JSON.parse(readFileSync(process.argv[2], 'utf8'))

const hex = (c) => {
  if (!c) return null
  const to = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')
  return ('#' + to(c.r) + to(c.g) + to(c.b)).toUpperCase()
}

/* ── 1. 텍스트 스타일 ────────────────────────────────────────── */
const texts = nodes
  .filter((n) => n.type === 'TEXT' && n.textData?.characters?.trim())
  .map((n) => ({
    text: n.textData.characters.replace(/\n/g, '⏎').trim().slice(0, 40),
    font: `${n.fontName?.family ?? '?'} ${n.fontName?.style ?? ''}`.trim(),
    size: n.fontSize,
    lineHeight: n.lineHeight?.value ? Math.round(n.lineHeight.value * 10) / 10 : null,
    letterSpacing: n.letterSpacing?.value ?? null,
    color: hex(n.fillPaints?.find((p) => p.visible !== false && p.type === 'SOLID')?.color),
  }))

console.log(`\n=== 텍스트 노드 ${texts.length}개 ===`)
for (const t of texts) {
  console.log(
    `${String(t.size).padStart(4)}px ${(t.font || '').padEnd(16)} ${(t.color ?? '-').padEnd(8)} "${t.text}"`,
  )
}

/* ── 2. 사용된 폰트 ─────────────────────────────────────────── */
const fonts = new Map()
for (const t of texts) {
  const key = t.font
  if (!fonts.has(key)) fonts.set(key, new Set())
  fonts.get(key).add(t.size)
}
console.log('\n=== 폰트 ===')
for (const [f, sizes] of fonts) {
  console.log(`  ${f}: ${[...sizes].sort((a, b) => a - b).join(', ')}px`)
}

/* ── 3. 색상 팔레트 (fill/stroke 전체) ───────────────────────── */
const colors = new Map()
const bump = (h, where) => {
  if (!h) return
  if (!colors.has(h)) colors.set(h, { count: 0, where: new Set() })
  const e = colors.get(h)
  e.count++
  e.where.add(where)
}
for (const n of nodes) {
  for (const p of n.fillPaints ?? []) {
    if (p.type === 'SOLID' && p.visible !== false) bump(hex(p.color), n.type)
  }
  for (const p of n.strokePaints ?? []) {
    if (p.type === 'SOLID' && p.visible !== false) bump(hex(p.color), n.type + ':stroke')
  }
}
console.log('\n=== 색상 팔레트 (사용 횟수순) ===')
for (const [h, e] of [...colors].sort((a, b) => b[1].count - a[1].count).slice(0, 24)) {
  console.log(`  ${h}  ${String(e.count).padStart(4)}회  ${[...e.where].slice(0, 4).join(', ')}`)
}

/* ── 4. 프레임(화면·컴포넌트) 목록 ──────────────────────────── */
const frames = nodes
  .filter((n) => (n.type === 'FRAME' || n.type === 'SYMBOL') && n.name)
  .map((n) => ({
    type: n.type,
    name: n.name,
    w: n.size ? Math.round(n.size.x) : null,
    h: n.size ? Math.round(n.size.y) : null,
    radius: n.cornerRadius ?? null,
    fill: hex(n.fillPaints?.find((p) => p.type === 'SOLID' && p.visible !== false)?.color),
  }))

console.log(`\n=== 프레임/컴포넌트 ${frames.length}개 ===`)
for (const f of frames) {
  const size = f.w != null ? `${f.w}×${f.h}` : ''
  console.log(
    `  [${f.type.padEnd(6)}] ${(f.name ?? '').slice(0, 34).padEnd(36)} ${size.padEnd(10)} r=${f.radius ?? '-'} ${f.fill ?? ''}`,
  )
}

/* ── 5. 모서리 반경 분포 ────────────────────────────────────── */
const radii = new Map()
for (const n of nodes) {
  if (typeof n.cornerRadius === 'number' && n.cornerRadius > 0) {
    radii.set(n.cornerRadius, (radii.get(n.cornerRadius) ?? 0) + 1)
  }
}
console.log('\n=== 모서리 반경 ===')
for (const [r, c] of [...radii].sort((a, b) => a[0] - b[0])) console.log(`  ${r}px: ${c}개`)
