import { ROUTES } from '@/constants'
import { formatDate, getTodayIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

/** 우리반 › 학사일정 — 나이스 일정과 학급 행사를 합쳐 다가오는 순서로. */
export function ScheduleSectionPage() {
  const todayIso = getTodayIso()

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
                {/* 나이스가 준 휴업 여부는 학교마다 채우는 방식이 달라 믿기 어렵고,
                    '여름방학'처럼 제목만 봐도 알 수 있어 표시하지 않는다 */}
                {item.isClassEvent && <span className="shrink-0 text-xs text-brand-700">학급</span>}
              </li>
            ))}
          </ul>
        )
      }
    </ClassroomSectionShell>
  )
}
