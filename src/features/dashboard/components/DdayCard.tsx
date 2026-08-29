import { useState } from 'react'
import dropDownIcon from '@/assets/icons/drop_down.svg'
import pinIcon from '@/assets/icons/pin.svg'
import { relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Notice } from '@/types'

interface DdayCardProps {
  assignment: Notice
}

/** 마감 임박 과제 한 건을 D-day와 함께 보여주고, 펼치면 내용을 확인한다. */
export function DdayCard({ assignment }: DdayCardProps) {
  const [expanded, setExpanded] = useState(false)
  const dday = assignment.dueAt ? relativeDayLabel(assignment.dueAt) : null

  return (
    <div className="rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 text-left"
      >
        <img src={pinIcon} alt="" className="size-7 shrink-0" draggable={false} />
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

      {expanded && (
        <p className="mt-3 border-t border-ink-100 pt-3 text-sm leading-relaxed text-ink-600">
          {assignment.body}
        </p>
      )}
    </div>
  )
}
