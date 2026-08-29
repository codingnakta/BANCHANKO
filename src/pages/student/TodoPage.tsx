import { AppHeader } from '@/components/layout'
import { EmptyState, Spinner } from '@/components/ui'
import { DdayCard, useDashboard } from '@/features/dashboard'

/** 할일 탭 — 마감 임박 과제·미확인 공지·다가오는 행사·AI 오늘 할 일 (F-ZYSPUS) */
export function TodoPage() {
  const { data, isPending } = useDashboard()

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const assignments = data?.upcomingAssignments ?? []

  return (
    <>
      <AppHeader title="어쩌고저쩌고 체크해봐요" hasUnreadNotification={data?.hasUnreadNotification} />

      <section>
        <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">다가오는 일정</h2>

        {assignments.length === 0 ? (
          <EmptyState message="지금 확인할 할 일이 없습니다." />
        ) : (
          <ul className="flex flex-col gap-3">
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <DdayCard assignment={assignment} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
