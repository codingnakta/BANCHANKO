import { Link } from 'react-router'
import { AppHeader } from '@/components/layout'
import { EmptyState, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { DdayCard, useDashboard } from '@/features/dashboard'
import { getTodayIso, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'

/**
 * 할일 탭 (역할 공통).
 * 다가오는 일정과 과제를 모아 보여주고, 교사에게는 맨 위에 작성 링크를 더한다.
 */
export function TodoPage() {
  const isTeacher = useIsTeacher()
  const { data, isPending } = useDashboard()

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const events = data?.upcomingEvents ?? []
  const assignments = data?.upcomingAssignments ?? []
  const todayIso = getTodayIso()

  return (
    <>
      <AppHeader title="할일" hasUnreadNotification={data?.hasUnreadNotification} />

      <div className="flex flex-col gap-7">
        {/* 교사만 — 공지사항·과제 작성 */}
        {isTeacher && (
          <section className="flex gap-2">
            <Link
              to={ROUTES.teacher.noticeNew}
              className="flex-1 rounded-card bg-white px-4 py-3.5 text-center text-[15px] font-medium text-ink-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
            >
              공지사항·과제 작성
            </Link>
            <Link
              to={ROUTES.teacher.notices}
              className="rounded-card bg-white px-4 py-3.5 text-[15px] font-medium text-ink-600 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
            >
              관리
            </Link>
          </section>
        )}

        {/* 다가오는 일정 */}
        <section>
          <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">다가오는 일정</h2>
          {events.length === 0 ? (
            <EmptyState message="예정된 일정이 없습니다." />
          ) : (
            <ul className="flex flex-col gap-2">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    to={ROUTES.noticeDetail(event.id)}
                    className="flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink-900">
                        {event.title}
                      </span>
                      {event.description && (
                        <span className="mt-0.5 block truncate text-xs text-ink-500">
                          {event.description}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-base font-medium tabular-nums',
                        event.startAt.slice(0, 10) === todayIso ? 'text-danger' : 'text-ink-900',
                      )}
                    >
                      {relativeDayLabel(event.startAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 과제 */}
        <section>
          <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">과제</h2>
          {assignments.length === 0 ? (
            <EmptyState message="지금 확인할 과제가 없습니다." />
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
      </div>
    </>
  )
}
