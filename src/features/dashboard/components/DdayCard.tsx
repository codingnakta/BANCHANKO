import { useState } from 'react'
import dropDownIcon from '@/assets/icons/drop_down.svg'
import { PinIcon } from '@/components/icons'
import { togglePinnedPost, usePinnedPostId } from '../hooks/usePinnedPost'
import { relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Notice } from '@/types'

interface DdayCardProps {
  assignment: Notice
}

/**
 * 마감 임박 과제 한 건. 펼치면 내용을 보여준다.
 *
 * 왼쪽 핀을 누르면 이 과제를 홈에 띄운다. 핀은 하나만 파란색이고
 * 나머지는 회색이며, 같은 핀을 다시 누르면 고정이 풀린다.
 */
export function DdayCard({ assignment }: DdayCardProps) {
  const [expanded, setExpanded] = useState(false)
  const pinned = usePinnedPostId() === assignment.id
  const dday = assignment.dueAt ? relativeDayLabel(assignment.dueAt) : null

  return (
    <div className="rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => togglePinnedPost(assignment.id)}
          aria-pressed={pinned}
          aria-label={pinned ? `${assignment.title} 홈 고정 해제` : `${assignment.title} 홈에 고정`}
          className={cn(
            'shrink-0 rounded-full transition-colors',
            pinned ? 'text-brand-400' : 'text-ink-300 hover:text-ink-400',
          )}
        >
          <PinIcon filled={pinned} className="size-7" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="min-w-0 flex-1 truncate text-base font-medium text-ink-900">
            {assignment.title}
          </span>
          {dday && (
            <span className="shrink-0 text-base font-medium tracking-tight text-ink-900 tabular-nums">
              {dday}
            </span>
          )}
          <img
            src={dropDownIcon}
            alt=""
            draggable={false}
            className={cn('size-6 shrink-0 transition-transform', expanded && 'rotate-180')}
          />
        </button>
      </div>

      {expanded && (
        <p className="mt-3 border-t border-ink-100 pt-3 text-sm leading-relaxed text-ink-600">
          {assignment.body}
        </p>
      )}
    </div>
  )
}
