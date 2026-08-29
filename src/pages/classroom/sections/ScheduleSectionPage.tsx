import { format } from 'date-fns'
import { ROUTES } from '@/constants'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

/** 우리반 › 학사일정 — 나이스 일정과 학급 행사를 합쳐 다가오는 순서로. */
export function ScheduleSectionPage() {
  const todayIso = format(new Date(), 'yyyy-MM-dd')

  return (
    <ClassroomSectionShell
      title="학사일정"
      edit={{ to: ROUTES.teacher.noticeNew, label: '행사 등록' }}
    >
      {(data) =>
        data.schedule.length === 0 ? (
          <Blank>다가오는 일정이 없어요.</Blank>
        ) : (
          <ul className="overflow-hidden rounded-card bg-white">
            {data.schedule.map((item) => (
              <li
                key={`${item.date}-${item.title}`}
                className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 last:border-0"
              >
                <span
                  className={cn(
                    'w-16 shrink-0 text-xs font-semibold',
                    item.date === todayIso ? 'text-danger' : 'text-brand-700',
                  )}
                >
                  {formatDate(`${item.date}T00:00:00`, 'M/d(E)')}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{item.title}</span>
                {item.isClassEvent ? (
                  <span className="shrink-0 text-xs text-brand-700">학급</span>
                ) : item.isHoliday ? (
                  <span className="shrink-0 text-xs text-ink-400">휴업</span>
                ) : null}
              </li>
            ))}
          </ul>
        )
      }
    </ClassroomSectionShell>
  )
}
