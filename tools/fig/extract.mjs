#!/usr/bin/env node
/**
 * .fig 파일에서 디자인 스펙과 이미지 에셋을 추출한다.
 *
 *   node tools/fig/extract.mjs docs/반창고.fig [출력디렉터리]
 *
 * .fig 는 zip 이고 그 안의 canvas.fig 는 Figma 의 kiwi 바이너리다.
 * (헤더 fig-kiwi + deflate 스키마 청크 + zstd 데이터 청크)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateRawSync, zstdDecompressSync } from 'node:zlib'
import { createDecoder, decodeSchema } from './kiwi.mjs'

const figPath = process.argv[2]
const outDir = process.argv[3] ?? 'fig-extract'
if (!figPath) {
  console.error('사용법: node tools/fig/extract.mjs <파일.fig> [출력디렉터리]')
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
execFileSync('unzip', ['-o', '-q', figPath, '-d', outDir])
console.log(`압축 해제 → ${outDir}/ (images/ 안에 원본 에셋)`)

// canvas.fig 청크 분리
const buf = readFileSync(join(outDir, 'canvas.fig'))
if (buf.subarray(0, 8).toString('latin1') !== 'fig-kiwi') {
  console.error('fig-kiwi 헤더가 아닙니다.')
  process.exit(1)
}
const chunks = []
let off = 12
while (off + 4 <= buf.length) {
  const len = buf.readUInt32LE(off)
  off += 4
  if (len === 0 || off + len > buf.length) break
  const raw = buf.subarray(off, off + len)
  off += len
  chunks.push(
    raw.readUInt32LE(0) === 0xfd2fb528 ? zstdDecompressSync(raw) : inflateRawSync(raw),
  )
}

const defs = decodeSchema(chunks[0])
const msg = createDecoder(defs).decode(chunks[1], 'Message')
const nodes = msg.nodeChanges ?? []

const nodesPath = join(outDir, 'nodes.json')
writeFileSync(nodesPath, JSON.stringify(nodes, null, 2))
console.log(`노드 ${nodes.length}개 → ${nodesPath}`)
console.log(`\n스펙 요약을 보려면:\n  node tools/fig/figspec.mjs ${nodesPath}`)

if (!existsSync(join(outDir, 'images'))) console.log('(이미지 에셋 없음)')
