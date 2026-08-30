import { AppHeader } from '@/components/layout'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { Card, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import {
  PinnedTasks,
  TimetableMealTabs,
  TodayDutyCard,
  TodayHeroCard,
  useDashboard,
} from '@/features/dashboard'

/**
 * 교사 홈.
 * 학생 홈과 같은 구성·같은 컴포넌트를 쓰고, 각 묶음에 관리 화면으로 가는 링크만 더한다.
 */
export function TeacherHomePage() {
  const teacherName = useCurrentUser()?.name ?? ''
  const { data, isPending, isError, error, refetch } = useDashboard()

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-ink-600">
          {error instanceof Error ? error.message : '오늘 정보를 불러오지 못했습니다.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-medium text-brand-500 hover:underline"
        >
          다시 시도
        </button>
      </Card>
    )
  }


  return (
    <>
      <AppHeader heading={`${teacherName} 선생님 안녕하세요`} />

      <div className="flex flex-col gap-6">
        <TodayHeroCard tasks={data.todayTasks} />

        {/* 꽂아 둔 우리반 과제와 내 할일 */}
        <PinnedTasks assignments={data.upcomingAssignments} />

        <TodayDutyCard duties={data.cleaningDuties} editTo={ROUTES.teacher.settings} />

        {/* 시간표·급식 — 학생 홈과 같은 탭 카드 */}
        <TimetableMealTabs entries={data.timetable} meal={data.meal} />
      </div>
    </>
  )
}
