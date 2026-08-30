import { ROUTES } from '@/constants'
import { formatDate, getTodayIso } from '@/lib/date'
import { cn } from '@/lib/utils'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'
import type { ScheduleItem } from '@/features/classroom/api/classroomBoard'

/**
 * 우리반 › 학사일정.
 *
 * 나이스 일정과 교사가 올린 학급 행사를 합쳐 학년도 끝까지 보여준다.
 * 지난 일정은 빼고 가까운 날부터 세우며, 달이 바뀌면 제목을 넣어 끊어 준다.
 */
export function ScheduleSectionPage() {
  const todayIso = getTodayIso()

  return (
    <ClassroomSectionShell
      title="학사일정"
      edit={{ to: ROUTES.teacher.noticeNew, label: '공지 쓰기' }}
    >
      {(data) =>
        data.schedule.length === 0 ? (
          <Blank>다가오는 일정이 없어요.</Blank>
        ) : (
          <div className="flex flex-col gap-5">
            {groupByMonth(data.schedule).map(([month, items]) => (
              <section key={month}>
                <h2 className="mb-2 px-1 text-sm font-bold text-ink-500">{month}</h2>
                <ul className="overflow-hidden rounded-card bg-white">
                  {items.map((item) => (
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
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-900">
                        {item.title}
                      </span>
                      {/* 나이스가 준 휴업 여부는 학교마다 채우는 방식이 달라 믿기 어렵고,
                          '여름방학'처럼 제목만 봐도 알 수 있어 표시하지 않는다 */}
                      {item.isClassEvent && (
                        <span className="shrink-0 text-xs text-brand-700">학급</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      }
    </ClassroomSectionShell>
  )
}

/** 달별로 끊는다. 학년도 전체가 한 줄로 이어지면 눈이 미끄러진다. */
function groupByMonth(schedule: ScheduleItem[]): [string, ScheduleItem[]][] {
  const months = new Map<string, ScheduleItem[]>()

  for (const item of schedule) {
    const month = formatDate(`${item.date}T00:00:00`, 'yyyy년 M월')
    const bucket = months.get(month)
    if (bucket) bucket.push(item)
    else months.set(month, [item])
  }

  return [...months.entries()]
}
