import { Link } from 'react-router'
import { format } from 'date-fns'
import { CalendarDays, ClipboardList, Sparkles, Trash2, Utensils } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Card, CardTitle, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useDashboard } from '@/features/dashboard'
import { formatDate, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/**
 * 교사 홈.
 * 위에서부터 과제 안내, 청소 당번, 오늘 시간표, 오늘 급식, 오늘 행사 순으로 보여준다.
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

  const today = new Date()
  const todayIso = format(today, 'yyyy-MM-dd')
  const todayEvents = data.upcomingEvents.filter((e) => e.startAt.slice(0, 10) === todayIso)

  return (
    <>
      <AppHeader classroomName={data.classroomName} />

      <p className="-mt-2 mb-4 px-1 text-sm text-ink-500">{formatDate(today.toISOString())}</p>

      <div className="flex flex-col gap-4">
        {/* 1. 과제 안내 — 오늘 할 일 */}
        <Section
          title="과제 안내"
          icon={<Sparkles className="size-4" />}
          action={{ label: '안내 관리', to: ROUTES.teacher.notices }}
        >
          {data.upcomingAssignments.length === 0 ? (
            <Empty message="등록된 과제가 없어요." to={ROUTES.teacher.noticeNew} cta="과제 등록하기" />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.upcomingAssignments.slice(0, 5).map((assignment) => {
                const isToday = assignment.dueAt?.slice(0, 10) === todayIso
                return (
                  <li key={assignment.id}>
                    <Link
                      to={ROUTES.noticeDetail(assignment.id)}
                      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 transition-colors hover:bg-brand-50"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">
                        {assignment.title}
                      </span>
                      {assignment.dueAt && (
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                            isToday
                              ? 'bg-danger/10 text-danger'
                              : 'bg-ink-100 text-ink-600',
                          )}
                        >
                          {relativeDayLabel(assignment.dueAt)}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        {/* 2. 청소 당번 */}
        <Section
          title="오늘 청소 당번"
          icon={<Trash2 className="size-4" />}
          action={{ label: '당번 설정', to: ROUTES.teacher.settings }}
        >
          {data.cleaningDuties.length === 0 ? (
            <Empty message="오늘 당번이 없어요." to={ROUTES.teacher.settings} cta="당번 정하기" />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.cleaningDuties.map((duty) => (
                <li key={duty.id} className="rounded-xl bg-white px-4 py-3">
                  <p className="text-sm font-medium text-ink-900">{duty.area}</p>
                  <p className="mt-0.5 text-sm text-ink-600">
                    {duty.studentNames.length > 0 ? duty.studentNames.join(', ') : '미지정'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 3. 오늘 시간표 */}
        <Section
          title="오늘 시간표"
          icon={<ClipboardList className="size-4" />}
          action={{ label: '검수', to: ROUTES.teacher.timetable }}
        >
          {!data.timetable || data.timetable.length === 0 ? (
            <Empty
              message="오늘 시간표가 없어요."
              to={ROUTES.teacher.timetable}
              cta="시간표 가져오기"
            />
          ) : (
            <ul className="flex flex-col gap-1">
              {data.timetable.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5"
                >
                  <span className="w-8 shrink-0 text-sm font-semibold text-brand-700">
                    {entry.periodLabel ?? `${entry.period}교시`}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-900">
                    {entry.subject || '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 4. 오늘 급식 */}
        <Section title="오늘 급식" icon={<Utensils className="size-4" />}>
          {!data.meal || data.meal.items.length === 0 ? (
            <p className="rounded-xl bg-white px-4 py-3 text-sm text-ink-500">
              오늘 급식 정보가 없어요.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-x-2 gap-y-1.5 rounded-xl bg-white px-4 py-3.5">
              {data.meal.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-800"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 5. 오늘 행사 */}
        <Section
          title="오늘 행사"
          icon={<CalendarDays className="size-4" />}
          action={{ label: '행사 등록', to: ROUTES.teacher.noticeNew }}
        >
          {todayEvents.length === 0 ? (
            <p className="rounded-xl bg-white px-4 py-3 text-sm text-ink-500">
              오늘은 예정된 행사가 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {todayEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    to={ROUTES.noticeDetail(event.id)}
                    className="block rounded-xl bg-white px-4 py-3 transition-colors hover:bg-brand-50"
                  >
                    <p className="truncate text-sm font-medium text-ink-900">{event.title}</p>
                    {event.description && (
                      <p className="mt-0.5 truncate text-xs text-ink-500">{event.description}</p>
                    )}
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

interface SectionProps {
  title: string
  icon: ReactNode
  action?: { label: string; to: string }
  children: ReactNode
}

function Section({ title, icon, action, children }: SectionProps) {
  return (
    <section className="rounded-card bg-ink-50 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-brand-700">{icon}</span>
        <CardTitle className="flex-1 text-base">{title}</CardTitle>
        {action && (
          <Link to={action.to} className="text-xs font-medium text-brand-500 hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Empty({ message, to, cta }: { message: string; to: string; cta: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-4 text-center">
      <p className="text-sm text-ink-500">{message}</p>
      <Link to={to} className="mt-1 inline-block text-sm font-medium text-brand-500 hover:underline">
        {cta}
      </Link>
    </div>
  )
}
