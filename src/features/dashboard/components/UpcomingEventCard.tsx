import { Link } from 'react-router'
import { ROUTES } from '@/constants'
import { formatDate, isImminent, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { ClassEvent } from '@/types'

interface UpcomingEventCardProps {
  events: ClassEvent[]
}

/** 다가오는 학급 행사. 공개된 일정만 전달된다. (F-WFEXUJ) */
export function UpcomingEventCard({ events }: UpcomingEventCardProps) {
  if (events.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">다가오는 행사</h2>

      <ul className="flex flex-col gap-2">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              to={ROUTES.eventDetail(event.id)}
              className="group flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{event.title}</p>
                <p className="mt-0.5 text-xs text-ink-500">{formatDate(event.startAt)}</p>
              </div>
              {/* 당일·임박 일정은 일반 예정 정보와 구분해 표시한다 (F-ZTJSNU) */}
              <span
                className={cn(
                  'shrink-0 text-sm font-bold tracking-tight',
                  isImminent(event.startAt) ? 'text-brand-500' : 'text-ink-900',
                )}
              >
                {relativeDayLabel(event.startAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
