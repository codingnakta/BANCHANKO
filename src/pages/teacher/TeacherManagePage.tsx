import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Settings, Users } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { ROUTES } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { fetchRoster, rosterKeys } from '@/features/teacher/api/roster'
import { useMyClassroomRow } from '@/features/teacher/hooks/useMyClassroomRow'

/**
 * 학급운영 탭 (교사 전용).
 * 학생 관리와 학급 기본 정보 두 가지만 둔다.
 * 공지·과제 작성은 할일 탭, 시간표 검수는 우리반 › 전체시간표로 들어간다.
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
  const withRole = roster?.filter((member) => member.classRole).length ?? 0

  const items = [
    {
      label: '학생 관리',
      description: '명단 등록, 1인1역',
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
  ]

  return (
    <>
      <AppHeader title={classroom?.name ?? '학급운영'} />

      {classroom?.school_name && (
        <p className="-mt-2 mb-5 px-1 text-sm text-ink-500">
          {classroom.school_name}
          {withRole > 0 && ` · 1인1역 ${withRole}명`}
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
