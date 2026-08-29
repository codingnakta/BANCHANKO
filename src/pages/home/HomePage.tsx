import { AppHeader } from '@/components/layout'
import { Spinner } from '@/components/ui'
import {
  DdayCard,
  TimetableMealTabs,
  TodayHeroCard,
  UnreadNoticeCard,
  useDashboard,
} from '@/features/dashboard'

/**
 * 홈 탭 — 오늘의 학급 정보 대시보드 (F-ZTJSNU).
 * 미확인 공지와 당일·임박 일정을 우선 표시하고, 각 항목은 원본 상세로 이동한다.
 * 이 화면에서 원본 데이터를 수정할 수 없다.
 */
export function HomePage() {
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
      <div className="rounded-card bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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
      </div>
    )
  }

  return (
    <>
      <AppHeader
        classroomName={data.classroomName}
        hasUnreadNotification={data.hasUnreadNotification}
      />

      <div className="flex flex-col gap-4">
        <TodayHeroCard tasks={data.todayTasks} />

        {/* 마감이 가장 임박한 과제 */}
        {data.upcomingAssignments[0] && <DdayCard assignment={data.upcomingAssignments[0]} />}

        <TimetableMealTabs
          entries={data.timetable}
          meal={data.meal}
          currentPeriod={data.currentPeriod}
        />

        <UnreadNoticeCard notices={data.unreadNotices} />
      </div>
    </>
  )
}
