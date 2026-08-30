import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Card, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useCurrentUser, useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { useClassroomBoard } from '@/features/classroom'
import { fetchRoster, rosterKeys } from '@/features/teacher/api/roster'
import { getTodayIso } from '@/lib/date'

/**
 * 우리반 — 학급 정보를 한 장의 목록으로 보여준다.
 *
 * 여기 있는 것은 전부 학급 정보라, 교사용 '관리' 묶음을 따로 두지 않는다.
 * 교사는 각 항목에 들어가서 그 자리의 편집 링크로 고친다.
 * (예: 청소당번 → 설정, 학급규칙 → 수정)
 *
 * 공지사항·학사일정은 맨 위에 두고, 누르면 바로 그 화면으로 들어간다.
 */
export function ClassroomBoardPage() {
  const isTeacher = useIsTeacher()
  const classroomId = useCurrentUser()?.classroomId ?? ''
  const { data, isPending, isError, error, refetch } = useClassroomBoard()

  // 명단 인원은 교사에게만 필요하다
  const { data: roster } = useQuery({
    queryKey: rosterKeys.list(classroomId),
    queryFn: () => fetchRoster(classroomId),
    enabled: isTeacher && Boolean(classroomId),
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

  const todayIso = getTodayIso()
  const dutyAreas = new Set(data.duties.map((duty) => duty.area)).size

  return (
    <>
      <AppHeader title={data.classroom.name} showBell={!isTeacher} />
      <p className="-mt-2 mb-6 px-1 text-sm text-ink-500">
        {data.classroom.school_name && `${data.classroom.school_name} · `}
        담임 {data.teacherName} 선생님
      </p>

      {/* 묶음 제목 없이 한 장에 줄로 세운다 */}
      <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <MenuRow
          label="1인1역"
          to={ROUTES.classroomSection.roles}
          meta={count(data.roles.length, '명')}
        />
        {isTeacher && (
          <MenuRow
            label="학생 명단"
            to={ROUTES.teacher.students}
            meta={
              roster
                ? `${roster.filter((member) => member.joined).length}/${roster.length}명`
                : '등록'
            }
          />
        )}
        <MenuRow
          label="학사일정"
          to={ROUTES.classroomSection.schedule}
          meta={
            data.schedule.some((item) => item.date === todayIso)
              ? '오늘 일정 있음'
              : count(data.schedule.length, '건')
          }
        />
        <MenuRow
          label="전체시간표"
          to={ROUTES.classroomSection.timetable}
          meta={data.weekTimetable ? '공개됨' : '미공개'}
        />
        <MenuRow
          label="급식"
          to={ROUTES.classroomSection.meal}
          meta={data.meal && data.meal.items.length > 0 ? '오늘 메뉴' : '없음'}
        />
        <MenuRow
          label="청소당번"
          to={ROUTES.classroomSection.duties}
          meta={dutyAreas > 0 ? `구역 ${dutyAreas}개` : '없음'}
        />
        <MenuRow
          label="학급규칙"
          to={ROUTES.classroomSection.rules}
          meta={count(data.rules.length, '개')}
        />
      </ul>
    </>
  )
}

/** 눌러서 들어가는 줄 하나. */
function MenuRow({ label, to, meta }: { label: string; to: string; meta: string }) {
  return (
    <li className="border-b border-ink-100 last:border-0">
      <Link
        to={to}
        className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-brand-50"
      >
        <span className="min-w-0 flex-1 text-[15px] font-medium text-ink-900">{label}</span>
        <span className="shrink-0 text-sm text-ink-400">{meta}</span>
        <ChevronRight className="size-5 shrink-0 text-ink-300" aria-hidden />
      </Link>
    </li>
  )
}

function count(value: number, unit: string) {
  return value > 0 ? `${value}${unit}` : '없음'
}
