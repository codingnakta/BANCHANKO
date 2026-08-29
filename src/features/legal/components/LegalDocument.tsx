import type { ReactNode } from 'react'

/**
 * 약관 본문을 화면에 그린다.
 *
 * 표기 규칙은 terms.ts 위쪽에 적어 두었다.
 *   # 장 / ## 조 / ### 소제목 / 1. 번호 항목 / - 가운뎃점 항목 / | 표 | 칸 |
 *   문장 안의 **굵게** 도 함께 다룬다.
 */
export function LegalDocument({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line) continue

    if (line.startsWith('# ')) {
      blocks.push(
        <h2 key={i} className="mt-7 border-b border-ink-200 pb-1.5 text-base font-bold text-ink-900 first:mt-0">
          {line.slice(2)}
        </h2>,
      )
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={i} className="mt-4 text-[13px] font-semibold text-ink-800">
          {line.slice(4)}
        </h4>,
      )
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={i} className="mt-5 text-sm font-semibold text-ink-900">
          {line.slice(3)}
        </h3>,
      )
      continue
    }

    // 표는 이어지는 | 줄을 한 덩어리로 모은다 (첫 줄이 머리글)
    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(
          lines[i]
            .trim()
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim()),
        )
        i += 1
      }
      i -= 1

      const [head, ...body] = rows
      blocks.push(
        <div key={i} className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {head.map((cell) => (
                  <th
                    key={cell}
                    className="border border-ink-200 bg-ink-50 px-2 py-1.5 text-left font-semibold text-ink-700"
                  >
                    {inline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border border-ink-200 px-2 py-1.5 align-top text-ink-700"
                    >
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    const numbered = /^(\d+)\.\s+(.*)$/.exec(line)
    if (numbered) {
      blocks.push(
        <p key={i} className="mt-1.5 flex gap-2 text-[13px] leading-relaxed text-ink-700">
          <span className="shrink-0 tabular-nums text-ink-500">{numbered[1]}.</span>
          <span>{inline(numbered[2])}</span>
        </p>,
      )
      continue
    }

    if (line.startsWith('- ')) {
      blocks.push(
        <p key={i} className="mt-1 flex gap-2 pl-4 text-[13px] leading-relaxed text-ink-600">
          <span className="shrink-0">·</span>
          <span>{inline(line.slice(2))}</span>
        </p>,
      )
      continue
    }

    blocks.push(
      <p key={i} className="mt-1.5 text-[13px] leading-relaxed text-ink-700">
        {inline(line)}
      </p>,
    )
  }

  return <div>{blocks}</div>
}

/** 문장 안의 **굵게** 를 살린다. */
function inline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  if (parts.length === 1) return text

  // split 결과는 [보통, 굵게, 보통, 굵게, …] 순으로 번갈아 온다
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-ink-900">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}
