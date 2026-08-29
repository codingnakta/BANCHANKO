import { Link } from 'react-router'
import { format } from 'date-fns'
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout'
import { Card, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import {
  DdayCard,
  TimetableMealTabs,
  TodayHeroCard,
  useDashboard,
} from '@/features/dashboard'
import { formatDate, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'

/**
 * 교사 홈.
 * 학생 홈과 같은 구성·같은 컴포넌트를 쓰고, 각 묶음에 관리 화면으로 가는 링크만 더한다.
 */
export function TeacherHomePage() {
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

  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const todayEvents = data.upcomingEvents.filter((e) => e.startAt.slice(0, 10) === todayIso)
  const shownEvents = todayEvents.length > 0 ? todayEvents : data.upcomingEvents.slice(0, 3)

  return (
    <>
      <AppHeader classroomName={data.classroomName} />

      <div className="flex flex-col gap-6">
        <TodayHeroCard tasks={data.todayTasks} />

        {/* 과제 안내 */}
        <Section title="과제 안내" action={{ to: ROUTES.teacher.notices, label: '관리' }}>
          {data.upcomingAssignments.length === 0 ? (
            <Blank message="등록된 과제가 없어요." to={ROUTES.teacher.noticeNew} cta="과제 등록하기" />
          ) : (
            <div className="flex flex-col gap-2">
              {data.upcomingAssignments.slice(0, 3).map((assignment) => (
                <DdayCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </Section>

        {/* 공지 */}
        <Section title="공지" action={{ to: ROUTES.teacher.noticeNew, label: '쓰기' }}>
          {data.unreadNotices.length === 0 ? (
            <Blank message="올린 공지가 없어요." to={ROUTES.teacher.noticeNew} cta="공지 쓰기" />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.unreadNotices.map((notice) => (
                <li key={notice.id}>
                  <Link
                    to={ROUTES.noticeDetail(notice.id)}
                    className="flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink-900">
                      {notice.title}
                    </span>
                    <span className="shrink-0 text-xs text-ink-400">
                      {formatDate(notice.publishedAt, 'M월 d일')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 청소 당번 */}
        <Section title="오늘 청소 당번" action={{ to: ROUTES.teacher.settings, label: '설정' }}>
          {data.cleaningDuties.length === 0 ? (
            <Blank message="오늘 당번이 없어요." to={ROUTES.teacher.settings} cta="당번 정하기" />
          ) : (
            <div className="rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <ul className="flex flex-col gap-3">
                {data.cleaningDuties.map((duty) => (
                  <li key={duty.id} className="flex items-start gap-2.5">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-900" aria-hidden />
                    <span className="text-[15px] text-ink-900">
                      <span className="font-medium">{duty.area}</span>
                      <span className="text-ink-600">
                        {' — '}
                        {duty.studentNames.join(', ') || '미지정'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* 시간표·급식 — 학생 홈과 같은 탭 카드 */}
        <TimetableMealTabs entries={data.timetable} meal={data.meal} />

        {/* 행사 */}
        <Section title="행사" action={{ to: ROUTES.teacher.noticeNew, label: '등록' }}>
          {shownEvents.length === 0 ? (
            <Blank message="예정된 행사가 없어요." to={ROUTES.teacher.noticeNew} cta="행사 등록하기" />
          ) : (
            <ul className="flex flex-col gap-2">
              {shownEvents.map((event) => (
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
        </Section>
      </div>
    </>
  )
}

/** 학생 홈의 탭 제목과 같은 크기·굵기로 맞춘 묶음 제목 */
function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: { to: string; label: string }
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline gap-3 px-1">
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        {action && (
          <Link
            to={action.to}
            className="ml-auto text-sm font-medium text-brand-500 hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Blank({ message, to, cta }: { message: string; to: string; cta: string }) {
  return (
    <div className="rounded-card bg-white px-4 py-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-ink-500">{message}</p>
      <Link to={to} className="mt-1 inline-block text-sm font-medium text-brand-500 hover:underline">
        {cta}
      </Link>
    </div>
  )
}
