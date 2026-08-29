#!/usr/bin/env node
/**
 * docs/ 의 탭바 아이콘 SVG를 인라인 React 컴포넌트로 변환한다.
 *
 *   node tools/icons/build-tab-icons.mjs
 *
 * 인라인으로 넣는 이유: fill 을 currentColor 로 바꿔야 활성/비활성 색을
 * 부모에서 제어할 수 있고, 아이콘 요청도 따로 나가지 않는다.
 *
 * 색 처리
 *  - 몸체(white / #5CAEFF) → currentColor
 *  - more 의 점처럼 배경색으로 칠해진 부분(#2B2B2B) → var(--icon-cutout)
 *    (다크 내비 위에서는 구멍처럼 보이고, 밝은 배경에서는 변수로 바꿔 끼운다)
 */
import { readFileSync, writeFileSync } from 'node:fs'

const ICONS = [
  { file: 'home', component: 'HomeIcon', label: '홈' },
  { file: 'classroom', component: 'CatIcon', label: '우리반' },
  { file: 'todo', component: 'ChatIcon', label: '할 일' },
  { file: 'more', component: 'BunnyIcon', label: '더보기' },
]

const parts = []

for (const { file, component, label } of ICONS) {
  const raw = readFileSync(`docs/${file}.svg`, 'utf8')

  const width = Number(raw.match(/width="(\d+)"/)?.[1])
  const height = Number(raw.match(/height="(\d+)"/)?.[1])
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1]

  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
    // 몸체 색 → currentColor
    .replace(/fill="white"/g, 'fill="currentColor"')
    .replace(/fill="#5CAEFF"/gi, 'fill="currentColor"')
    // 배경색으로 칠해진 구멍 → 변수
    .replace(/fill="#2B2B2B"/gi, 'fill="var(--icon-cutout, #2b2b2b)"')
    // JSX 속성명
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')

  parts.push(`/** ${label} */
export function ${component}({ className }: TabIconProps) {
  return (
    <svg
      width={${width}}
      height={${height}}
      viewBox="${viewBox}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      ${inner}
    </svg>
  )
}`)
}

const out = `// 이 파일은 tools/icons/build-tab-icons.mjs 가 docs/*.svg 로부터 생성합니다.
// 직접 수정하지 말고, 아이콘 SVG를 교체한 뒤 스크립트를 다시 실행하세요.

/**
 * 하단 탭바·사이드바 아이콘.
 * fill 이 currentColor 이므로 활성/비활성 색은 부모에서 정한다.
 * 배경색으로 칠해진 구멍(더보기 아이콘의 점)은 --icon-cutout 으로 맞춘다.
 */
interface TabIconProps {
  className?: string
}

${parts.join('\n\n')}
`

writeFileSync('src/components/icons/TabIcons.tsx', out)
console.log(`src/components/icons/TabIcons.tsx 생성 (아이콘 ${ICONS.length}개)`)
