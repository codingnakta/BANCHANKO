import { AppHeader } from '@/components/layout'
import { Spinner } from '@/components/ui'
import {
  ClassBoardSection,
  ClassRulesCard,
  CleaningDutyCard,
  useClassroom,
} from '@/features/classroom'
import { TimetableMealTabs } from '@/features/dashboard'

/**
 * 학생용 우리반 탭 (S2-4).
 * 학급 규칙, 시간표, 급식, 청소 당번, 공지·과제 목록을 조회만 한다.
 * 교사의 학급 운영 메뉴는 /teacher/manage 로 완전히 분리했다.
 */
export function StudentClassroomPage() {
  const { data, isPending, isError, refetch } = useClassroom()

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-card bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-ink-600">학급 정보를 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-medium text-brand-500 hover:underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  const { classroom, timetable, meal, cleaningDuties, notices } = data

  return (
    <>
      <AppHeader title={classroom.name} />

      <p className="-mt-2 mb-5 px-1 text-sm text-ink-500">담임 {classroom.teacherName} 선생님</p>

      <div className="flex flex-col gap-7">
        <ClassRulesCard rules={classroom.rules} />
        <TimetableMealTabs entries={timetable} meal={meal} />
        <CleaningDutyCard duties={cleaningDuties} />
        <ClassBoardSection notices={notices} />
      </div>
    </>
  )
}
