import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, Megaphone, Users } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Card, CardTitle, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useDashboard, TimetableMealTabs } from '@/features/dashboard'
import { fetchRoster, rosterKeys } from '@/features/teacher/api/roster'
import { formatDate } from '@/lib/date'

const QUICK_ACTIONS = [
  { label: '공지 쓰기', to: ROUTES.teacher.noticeNew, icon: Megaphone },
  { label: '학생 관리', to: ROUTES.teacher.students, icon: Users },
  { label: '출결 기록', to: ROUTES.teacher.attendance, icon: CalendarCheck },
]

/**
 * 교사 홈.
 * 오늘 학급이 어떻게 돌아가는지 보여주고, 자주 하는 일로 바로 넘어가게 한다.
 */
export function TeacherHomePage() {
  const user = useCurrentUser()
  const { data, isPending } = useDashboard()

  const { data: roster } = useQuery({
    queryKey: rosterKeys.list(user?.classroomId ?? 'none'),
    queryFn: () => fetchRoster(user!.classroomId!),
    enabled: Boolean(user?.classroomId),
  })

  if (isPending || !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const joined = roster?.filter((member) => member.joined).length ?? 0
  const total = roster?.length ?? 0
  const todayDuty = data.cleaningDuties[0]

  return (
    <>
      <AppHeader classroomName={data.classroomName} />

      <div className="flex flex-col gap-4">
        {/* 학생 참여 현황 */}
        <Card className="p-5">
          <p className="text-sm text-ink-500">{formatDate(new Date().toISOString())}</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">
            학생 {joined}
            <span className="text-ink-400">/{total}명</span> 참여
          </p>
          {total > joined && (
            <Link
              to={ROUTES.teacher.students}
              className="mt-2 inline-block text-sm font-medium text-brand-500 hover:underline"
            >
              아직 안 들어온 {total - joined}명 확인하기
            </Link>
          )}
          {total === 0 && (
            <Link
              to={ROUTES.teacher.students}
              className="mt-2 inline-block text-sm font-medium text-brand-500 hover:underline"
            >
              학생 명단 등록하기
            </Link>
          )}
        </Card>

        {/* 빠른 작업 */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex flex-col items-center gap-2 rounded-card bg-white px-2 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <action.icon className="size-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="text-xs font-medium text-ink-800">{action.label}</span>
            </Link>
          ))}
        </div>

        <TimetableMealTabs entries={data.timetable} meal={data.meal} />

        {todayDuty && (
          <Card className="p-5">
            <CardTitle className="text-base">오늘 청소 당번</CardTitle>
            <p className="mt-2 text-sm text-ink-700">
              {todayDuty.area} — {todayDuty.studentNames.join(', ') || '미지정'}
            </p>
          </Card>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-ink-900">최근 올린 안내</h2>
            <Link to={ROUTES.teacher.notices} className="text-sm text-brand-500 hover:underline">
              전체
            </Link>
          </div>

          {data.unreadNotices.length === 0 ? (
            <Card className="p-5 text-center">
              <p className="text-sm text-ink-500">아직 올린 안내가 없어요.</p>
              <Link
                to={ROUTES.teacher.noticeNew}
                className="mt-2 inline-block text-sm font-medium text-brand-500 hover:underline"
              >
                첫 공지 쓰기
              </Link>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.unreadNotices.map((notice) => (
                <li key={notice.id}>
                  <Link
                    to={ROUTES.noticeDetail(notice.id)}
                    className="block rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
                  >
                    <p className="truncate text-sm font-medium text-ink-900">{notice.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatDate(notice.publishedAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
