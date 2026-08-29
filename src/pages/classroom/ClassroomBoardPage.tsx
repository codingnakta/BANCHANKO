import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout'
import { Card, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useCurrentUser, useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { useClassroomBoard } from '@/features/classroom'
import { fetchRoster, rosterKeys } from '@/features/teacher/api/roster'
import { formatDate, getTodayIso, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'

/**
 * 우리반 — 학급 정보를 성격별로 묶어 보여준다.
 *
 * 여기 있는 것은 전부 학급 정보라, 교사용 '관리' 묶음을 따로 두지 않는다.
 * 교사는 각 항목에 들어가서 그 자리의 편집 링크로 고친다.
 * (예: 청소당번 → 설정, 학급규칙 → 수정)
 *
 * 공지사항·학사일정은 눌러서 들어가지 않고 맨 아래에 그대로 펼쳐 둔다.
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
      <AppHeader title={data.classroom.name} />
      <p className="-mt-2 mb-6 px-1 text-sm text-ink-500">
        {data.classroom.school_name && `${data.classroom.school_name} · `}
        담임 {data.teacherName} 선생님
      </p>

      <div className="flex flex-col gap-7">
        {/* 학교에서 정해져 내려오는 것 */}
        <Group title="수업">
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
        </Group>

        {/* 우리 반이 스스로 정한 약속 */}
        <Group title="생활">
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
        </Group>

        {/* 누가 무엇을 맡았는지 */}
        <Group title="우리 반 사람들">
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
        </Group>

        {/* 공지사항 — 눌러 들어가지 않고 여기서 다 본다 */}
        <section>
          <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">공지사항</h2>
          {data.notices.length === 0 ? (
            <Blank>올라온 공지가 없어요.</Blank>
          ) : (
            <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {data.notices.map((notice) => (
                <li key={notice.id} className="border-b border-ink-100 last:border-0">
                  <Link
                    to={ROUTES.noticeDetail(notice.id)}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink-900">
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
        </section>

        {/* 학사일정 */}
        <section>
          <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">학사일정</h2>
          {data.schedule.length === 0 ? (
            <Blank>다가오는 일정이 없어요.</Blank>
          ) : (
            <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {data.schedule.map((item) => (
                <li
                  key={`${item.date}-${item.title}`}
                  className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 last:border-0"
                >
                  <span
                    className={cn(
                      'w-16 shrink-0 text-xs font-semibold',
                      item.date === todayIso ? 'text-danger' : 'text-brand-700',
                    )}
                  >
                    {formatDate(`${item.date}T00:00:00`, 'M/d(E)')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{item.title}</span>
                  {item.isClassEvent && (
                    <span className="shrink-0 text-xs text-brand-700">학급</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

/** 내용이 없을 때의 한 줄 안내 */
function Blank({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card bg-white px-4 py-4 text-sm text-ink-500 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {children}
    </p>
  )
}

/** 제목 하나에 줄 몇 개. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">{title}</h2>
      <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {children}
      </ul>
    </section>
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
