import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Card, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useClassroomBoard } from '@/features/classroom'
import type { ClassroomBoard } from '@/features/classroom/api/classroomBoard'
import { getTodayIso } from '@/lib/date'

interface BoardMenuItem {
  label: string
  to: string
  /** 우측에 붙는 한 줄 요약 */
  meta: string
}

/**
 * 우리반 — 학급 정보를 설정 화면처럼 목록으로 보여준다.
 * 항목을 누르면 각각의 화면으로 들어가고, 편집 링크는 그 안에서 교사에게만 붙는다.
 */
export function ClassroomBoardPage() {
  const { data, isPending, isError, error, refetch } = useClassroomBoard()

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

  return (
    <>
      <AppHeader title={data.classroom.name} />
      <p className="-mt-2 mb-5 px-1 text-sm text-ink-500">
        {data.classroom.school_name && `${data.classroom.school_name} · `}
        담임 {data.teacherName} 선생님
      </p>

      <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {menuItems(data).map((item) => (
          <li key={item.label} className="border-b border-ink-100 last:border-0">
            <Link
              to={item.to}
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-brand-50"
            >
              <span className="min-w-0 flex-1 text-[15px] font-medium text-ink-900">
                {item.label}
              </span>
              <span className="shrink-0 text-sm text-ink-400">{item.meta}</span>
              <ChevronRight className="size-5 shrink-0 text-ink-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

/** 목록에 쓸 항목과 요약. 요약은 안에 무엇이 들어 있는지만 알려 준다. */
function menuItems(data: ClassroomBoard): BoardMenuItem[] {
  const todayIso = getTodayIso()
  const dutyAreas = new Set(data.duties.map((duty) => duty.area)).size
  const hasTodayEvent = data.schedule.some((item) => item.date === todayIso)

  return [
    {
      label: '공지사항',
      to: ROUTES.classroomSection.notices,
      meta: count(data.notices.length, '개'),
    },
    {
      label: '청소당번',
      to: ROUTES.classroomSection.duties,
      meta: dutyAreas > 0 ? `구역 ${dutyAreas}개` : '없음',
    },
    {
      label: '1인1역',
      to: ROUTES.classroomSection.roles,
      meta: count(data.roles.length, '명'),
    },
    {
      label: '전체시간표',
      to: ROUTES.classroomSection.timetable,
      meta: data.weekTimetable ? '공개됨' : '미공개',
    },
    {
      label: '급식',
      to: ROUTES.classroomSection.meal,
      meta: data.meal && data.meal.items.length > 0 ? '오늘 메뉴' : '없음',
    },
    {
      label: '학사일정',
      to: ROUTES.classroomSection.schedule,
      meta: hasTodayEvent ? '오늘 일정 있음' : count(data.schedule.length, '건'),
    },
    {
      label: '학급규칙',
      to: ROUTES.classroomSection.rules,
      meta: count(data.rules.length, '개'),
    },
  ]
}

function count(value: number, unit: string) {
  return value > 0 ? `${value}${unit}` : '없음'
}
