import { useState } from 'react'
import type { ReactNode } from 'react'
import dropDownIcon from '@/assets/icons/drop_down.svg'
import { PinIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** 우리반 과제는 파란색, 내 할일은 핑크색 */
export type TaskTone = 'brand' | 'mine'

const TONE = {
  brand: { on: 'text-brand-400', off: 'text-ink-300 hover:text-brand-300', arrow: 'text-brand-400' },
  mine: { on: 'text-mine-400', off: 'text-ink-300 hover:text-mine-300', arrow: 'text-mine-400' },
} satisfies Record<TaskTone, { on: string; off: string; arrow: string }>

interface TaskCardProps {
  title: string
  /** 'D-3' 같은 짧은 라벨 */
  dday?: string | null
  tone?: TaskTone
  pinned: boolean
  onTogglePin: () => void
  /** 완료한 할 일은 제목에 줄을 긋는다 */
  done?: boolean
  /** 펼쳤을 때 보여줄 것. 없으면 화살표를 감춘다 */
  children?: ReactNode
  /** 목록 안에 줄로 들어갈 때 — 카드 배경·그림자를 벗는다 */
  inList?: boolean
}

/**
 * 우리반 과제와 내 할일이 함께 쓰는 한 줄.
 *
 * 모양은 같고 핀과 화살표 색만 다르다. 화살표는 같은 아이콘을 마스크로
 * 써서 글자색을 따라간다 (원본 SVG 는 파란색이 박혀 있다).
 */
export function TaskCard({
  title,
  dday,
  tone = 'brand',
  pinned,
  onTogglePin,
  done,
  children,
  inList,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const color = TONE[tone]

  return (
    <div
      className={cn(
        'px-4 py-3.5',
        !inList && 'rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onTogglePin}
          aria-pressed={pinned}
          aria-label={pinned ? `${title} 홈 고정 해제` : `${title} 홈에 고정`}
          className={cn('shrink-0 transition-colors', pinned ? color.on : color.off)}
        >
          <PinIcon filled={pinned} className="size-7" />
        </button>

        <button
          type="button"
          onClick={() => children && setExpanded((prev) => !prev)}
          aria-expanded={children ? expanded : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-base font-medium',
              done ? 'text-ink-400 line-through' : 'text-ink-900',
            )}
          >
            {title}
          </span>
          {dday && (
            <span className="shrink-0 text-base font-medium tracking-tight text-ink-900 tabular-nums">
              {dday}
            </span>
          )}
          {children && (
            <span
              aria-hidden
              className={cn(
                'size-6 shrink-0 bg-current transition-transform',
                color.arrow,
                expanded && 'rotate-180',
              )}
              style={{
                maskImage: `url(${dropDownIcon})`,
                WebkitMaskImage: `url(${dropDownIcon})`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
              }}
            />
          )}
        </button>
      </div>

      {expanded && children && (
        <div className="mt-3 border-t border-ink-100 pt-3">{children}</div>
      )}
    </div>
  )
}
