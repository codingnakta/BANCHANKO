import { AppHeader } from '@/components/layout'
import { Spinner } from '@/components/ui'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import {
  ClassBoardSection,
  ClassRulesCard,
  CleaningDutyCard,
  TeacherMenuList,
  useClassroom,
} from '@/features/classroom'
import { TimetableMealTabs } from '@/features/dashboard'

/**
 * 우리반 탭 (F-ZYSPUS).
 *
 * 역할에 따라 다르게 보여준다.
 *  - 학생: 학급 규칙, 시간표, 급식, 청소 당번, 공지·과제·행사 목록
 *  - 담임교사: 학생 관리, 학급 기본 정보, 안내 관리, 시간표·급식 검수, 출결 기록 메뉴
 *
 * 학생에게 출결 기록 관리와 학생 소속 관리 메뉴는 표시하지 않는다.
 */
export function ClassroomPage() {
  const user = useCurrentUser()
  const { data, isPending, isError, refetch } = useClassroom()
  const isTeacher = user.role === 'teacher'

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

  const { classroom, timetable, meal, cleaningDuties, notices, events, studentCount } = data

  return (
    <>
      <AppHeader title={classroom.name} />

      <p className="-mt-2 mb-5 px-1 text-sm text-ink-500">담임 {classroom.teacherName} 선생님</p>

      <div className="flex flex-col gap-7">
        {isTeacher ? (
          <TeacherMenuList studentCount={studentCount} />
        ) : (
          <>
            <ClassRulesCard rules={classroom.rules} />
            <TimetableMealTabs entries={timetable} meal={meal} />
            <CleaningDutyCard duties={cleaningDuties} />
            <ClassBoardSection notices={notices} events={events} />
          </>
        )}
      </div>
    </>
  )
}
