import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Megaphone,
  Settings,
  Users,
} from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { ROUTES } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { fetchRoster, rosterKeys } from '@/features/teacher/api/roster'
import { useMyClassroomRow } from '@/features/teacher/hooks/useMyClassroomRow'

/**
 * 학급 운영 탭 (교사 전용).
 * 명세가 정한 다섯 항목을 모아둔다: 학생 관리, 학급 기본 정보, 안내 관리,
 * 시간표·급식 검수, 출결 기록.
 */
export function TeacherManagePage() {
  const user = useCurrentUser()
  const { data: classroom } = useMyClassroomRow()

  const { data: roster } = useQuery({
    queryKey: rosterKeys.list(user?.classroomId ?? 'none'),
    queryFn: () => fetchRoster(user!.classroomId!),
    enabled: Boolean(user?.classroomId),
  })

  const joined = roster?.filter((member) => member.joined).length ?? 0
  const helpers = roster?.filter((member) => member.helperSubject).length ?? 0

  const items = [
    {
      label: '학생 관리',
      description: '명단 등록, 과목도우미 지정',
      to: ROUTES.teacher.students,
      icon: Users,
      meta: roster ? `${joined}/${roster.length}명` : undefined,
    },
    {
      label: '학급 기본 정보',
      description: '학급명, 학급 규칙, 청소 당번',
      to: ROUTES.teacher.settings,
      icon: Settings,
      meta: classroom?.rules.length ? `규칙 ${classroom.rules.length}개` : undefined,
    },
    {
      label: '안내 관리',
      description: '공지와 과제 등록·수정',
      to: ROUTES.teacher.notices,
      icon: Megaphone,
    },
    {
      label: '시간표·급식 검수',
      description: '나이스 시간표를 확인하고 공개',
      to: ROUTES.teacher.timetable,
      icon: ClipboardList,
      meta: classroom?.timetable_published ? '공개됨' : '미공개',
    },
    {
      label: '출결 기록',
      description: '학생별 출결과 변경 이력',
      to: ROUTES.teacher.attendance,
      icon: CalendarCheck,
    },
  ]

  return (
    <>
      <AppHeader title={classroom?.name ?? '학급 운영'} />

      {classroom?.school_name && (
        <p className="-mt-2 mb-5 px-1 text-sm text-ink-500">
          {classroom.school_name}
          {helpers > 0 && ` · 과목도우미 ${helpers}명`}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              className="flex items-center gap-3.5 rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <item.icon className="size-5" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-ink-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-ink-500">{item.description}</p>
              </div>
              {item.meta && (
                <span className="shrink-0 text-sm font-medium text-ink-500">{item.meta}</span>
              )}
              <ChevronRight className="size-5 shrink-0 text-ink-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
