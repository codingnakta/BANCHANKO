import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  CalendarDays,
  ClipboardList,
  Megaphone,
  ScrollText,
  Trash2,
  UserCheck,
  Utensils,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout'
import { Card, CardTitle, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useCurrentUser, useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import {
  boardKeys,
  fetchClassroomBoard,
  WEEKDAY_NAMES,
} from '@/features/classroom/api/classroomBoard'
import { formatDate, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'

const PERIODS = [1, 2, 3, 4, 5, 6, 7]

/**
 * 우리반 — 학급 정보를 한곳에 모아 보여준다.
 * 교사와 학생이 같은 내용을 보고, 편집으로 가는 링크만 교사에게 붙는다.
 */
export function ClassroomBoardPage() {
  const user = useCurrentUser()
  const isTeacher = useIsTeacher()

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: boardKeys.detail(user?.classroomId ?? 'none'),
    queryFn: () => fetchClassroomBoard(),
    enabled: Boolean(user?.classroomId),
    staleTime: 30_000,
    refetchOnMount: 'always',
  })

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
          {error instanceof Error ? error.message : '학급 정보를 불러오지 못했습니다.'}
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
  const link = (to: string, label: string) => (isTeacher ? { to, label } : undefined)

  return (
    <>
      <AppHeader title={data.classroom.name} />
      <p className="-mt-2 mb-4 px-1 text-sm text-ink-500">
        {data.classroom.school_name && `${data.classroom.school_name} · `}
        담임 {data.teacherName} 선생님
      </p>

      <div className="flex flex-col gap-4">
        {/* 공지사항 */}
        <Section
          title="공지사항"
          icon={<Megaphone className="size-4" />}
          action={link(ROUTES.teacher.notices, '관리')}
        >
          {data.notices.length === 0 ? (
            <Blank>올라온 공지가 없어요.</Blank>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.notices.slice(0, 6).map((notice) => (
                <li key={notice.id}>
                  <Link
                    to={ROUTES.noticeDetail(notice.id)}
                    className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 transition-colors hover:bg-brand-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900">
                        {notice.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {notice.type === 'assignment' ? '과제' : '공지'} ·{' '}
                        {formatDate(notice.publishedAt, 'M월 d일')}
                      </span>
                    </span>
                    {notice.dueAt && (
                      <span className="shrink-0 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
                        {relativeDayLabel(notice.dueAt)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 청소당번 */}
        <Section
          title="청소당번"
          icon={<Trash2 className="size-4" />}
          action={link(ROUTES.teacher.settings, '설정')}
        >
          {data.duties.length === 0 ? (
            <Blank>정해진 당번이 없어요.</Blank>
          ) : (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5]
                .map((weekday) => ({
                  weekday,
                  rows: data.duties.filter((duty) => duty.weekday === weekday),
                }))
                .filter((day) => day.rows.length > 0)
                .map((day) => (
                  <div key={day.weekday} className="rounded-xl bg-white px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {WEEKDAY_NAMES[day.weekday]}
                      </span>
                      <span className="text-xs text-ink-400">구역 {day.rows.length}개</span>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {day.rows.map((duty) => (
                        <li key={duty.id} className="flex gap-2 text-sm">
                          <span className="w-16 shrink-0 truncate font-medium text-ink-900">
                            {duty.area}
                          </span>
                          <span className="min-w-0 flex-1 text-ink-600">
                            {duty.studentNames.join(', ') || '미지정'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </Section>

        {/* 1인1역 */}
        <Section
          title="1인1역"
          icon={<UserCheck className="size-4" />}
          action={link(ROUTES.teacher.students, '지정')}
        >
          {data.roles.length === 0 ? (
            <Blank>맡은 역할이 아직 없어요.</Blank>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.roles.map((role) => (
                <li
                  key={role.studentId}
                  className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2"
                >
                  <span className="text-sm font-medium text-ink-900">{role.name}</span>
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {role.subject}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 전체시간표 */}
        <Section
          title="전체시간표"
          icon={<ClipboardList className="size-4" />}
          action={link(ROUTES.teacher.timetable, '검수')}
        >
          {!data.weekTimetable ? (
            <Blank>
              {isTeacher
                ? '시간표를 검수해 공개하면 여기에 표시돼요.'
                : '아직 공개된 시간표가 없어요.'}
            </Blank>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-white p-2">
              <table className="w-full min-w-[22rem] border-separate border-spacing-0.5 text-center">
                <thead>
                  <tr>
                    <th className="w-7" />
                    {[1, 2, 3, 4, 5].map((weekday) => (
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
                      {[1, 2, 3, 4, 5].map((weekday) => {
                        const subject = data.weekTimetable?.[weekday]?.find(
                          (entry) => entry.period === period,
                        )?.subject
                        return (
                          <td
                            key={weekday}
                            className="rounded-md bg-ink-50 px-1 py-2 text-xs text-ink-800"
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
          )}
        </Section>

        {/* 급식 */}
        <Section title="오늘 급식" icon={<Utensils className="size-4" />}>
          {!data.meal || data.meal.items.length === 0 ? (
            <Blank>오늘 급식 정보가 없어요.</Blank>
          ) : (
            <ul className="flex flex-wrap gap-x-2 gap-y-1.5 rounded-xl bg-white px-4 py-3.5">
              {data.meal.items.map((item) => (
                <li key={item} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-800">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 학사일정 */}
        <Section
          title="학사일정"
          icon={<CalendarDays className="size-4" />}
          action={link(ROUTES.teacher.noticeNew, '행사 등록')}
        >
          {data.schedule.length === 0 ? (
            <Blank>다가오는 일정이 없어요.</Blank>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {data.schedule.slice(0, 8).map((item) => (
                <li
                  key={`${item.date}-${item.title}`}
                  className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5"
                >
                  <span
                    className={cn(
                      'w-14 shrink-0 text-xs font-semibold',
                      item.date === todayIso ? 'text-danger' : 'text-brand-700',
                    )}
                  >
                    {formatDate(`${item.date}T00:00:00`, 'M/d(E)')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{item.title}</span>
                  {item.isClassEvent ? (
                    <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                      학급
                    </span>
                  ) : item.isHoliday ? (
                    <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-500">
                      휴업
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 학급규칙 */}
        <Section
          title="학급규칙"
          icon={<ScrollText className="size-4" />}
          action={link(ROUTES.teacher.settings, '수정')}
        >
          {data.rules.length === 0 ? (
            <Blank>정해진 규칙이 없어요.</Blank>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {data.rules.map((rule, index) => (
                <li key={rule} className="flex gap-3 rounded-xl bg-white px-4 py-2.5">
                  <span className="shrink-0 text-sm font-bold text-brand-500">{index + 1}</span>
                  <span className="text-sm text-ink-800">{rule}</span>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>
    </>
  )
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon: ReactNode
  action?: { to: string; label: string }
  children: ReactNode
}) {
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

function Blank({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-white px-4 py-3 text-sm text-ink-500">{children}</p>
}
