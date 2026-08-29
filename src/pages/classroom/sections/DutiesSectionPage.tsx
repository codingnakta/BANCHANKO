import { ROUTES } from '@/constants'
import { WEEKDAY_NAMES } from '@/features/classroom/api/classroomBoard'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

const WEEKDAYS = [1, 2, 3, 4, 5]

/** 우리반 › 청소당번 — 요일별 구역과 담당 학생. */
export function DutiesSectionPage() {
  return (
    <ClassroomSectionShell title="청소당번" edit={{ to: ROUTES.teacher.settings, label: '설정' }}>
      {(data) =>
        data.duties.length === 0 ? (
          <Blank>정해진 당번이 없어요.</Blank>
        ) : (
          <div className="flex flex-col gap-2">
            {WEEKDAYS.map((weekday) => ({
              weekday,
              rows: data.duties.filter((duty) => duty.weekday === weekday),
            }))
              .filter((day) => day.rows.length > 0)
              .map((day) => (
                <section key={day.weekday} className="rounded-card bg-white px-4 py-3.5">
                  <h2 className="mb-2 text-[15px] font-semibold text-ink-900">
                    {WEEKDAY_NAMES[day.weekday]}요일
                  </h2>
                  <ul className="flex flex-col gap-1.5">
                    {day.rows.map((duty) => (
                      <li key={duty.id} className="flex gap-3 text-sm">
                        <span className="w-20 shrink-0 truncate font-medium text-ink-900">
                          {duty.area}
                        </span>
                        <span className="min-w-0 flex-1 text-ink-600">
                          {duty.studentNames.join(', ') || '미지정'}
                        </span>
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
