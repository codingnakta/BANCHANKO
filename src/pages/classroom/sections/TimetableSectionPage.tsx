import { ROUTES } from '@/constants'
import { useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { WEEKDAY_NAMES } from '@/features/classroom/api/classroomBoard'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

const PERIODS = [1, 2, 3, 4, 5, 6, 7]
const WEEKDAYS = [1, 2, 3, 4, 5]

/** 우리반 › 전체시간표 — 교사가 검수해 공개한 주간 시간표. */
export function TimetableSectionPage() {
  const isTeacher = useIsTeacher()

  return (
    <ClassroomSectionShell
      title="전체시간표"
      edit={{ to: ROUTES.teacher.timetable, label: '검수' }}
    >
      {(data) =>
        !data.weekTimetable ? (
          <Blank>
            {isTeacher
              ? '시간표를 검수해 공개하면 여기에 표시돼요.'
              : '아직 공개된 시간표가 없어요.'}
          </Blank>
        ) : (
          <div className="overflow-x-auto rounded-card bg-white p-3">
            <table className="w-full min-w-[22rem] border-separate border-spacing-0.5 text-center">
              <thead>
                <tr>
                  <th className="w-7" />
                  {WEEKDAYS.map((weekday) => (
                    <th key={weekday} className="pb-1 text-xs font-semibold text-ink-600">
                      {WEEKDAY_NAMES[weekday]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period}>
                    <th className="text-xs font-medium text-ink-400">{period}</th>
                    {WEEKDAYS.map((weekday) => {
                      const subject = data.weekTimetable?.[weekday]?.find(
                        (entry) => entry.period === period,
                      )?.subject
                      return (
                        <td
                          key={weekday}
                          className="rounded-md bg-ink-50 px-1 py-2.5 text-xs text-ink-800"
                        >
                          {subject || ''}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </ClassroomSectionShell>
  )
}
