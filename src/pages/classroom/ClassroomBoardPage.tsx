import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout'
import { Card, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useClassroomBoard } from '@/features/classroom'
import type { ClassroomBoard } from '@/features/classroom/api/classroomBoard'
import { formatDate, getTodayIso, relativeDayLabel } from '@/lib/date'
import { cn } from '@/lib/utils'

/** 미리보기로 보여줄 줄 수 */
const PREVIEW_COUNT = 3

/**
 * 우리반 — 학급 정보를 설정 화면처럼 목록으로 보여준다.
 * 공지사항·학사일정만 최신 세 줄을 미리 펼쳐 두고, 나머지는 눌러서 들어간다.
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

  const todayIso = getTodayIso()
  const notices = data.notices.slice(0, PREVIEW_COUNT)
  const schedule = data.schedule.slice(0, PREVIEW_COUNT)

  return (
    <>
      <AppHeader title={data.classroom.name} />
      <p className="-mt-2 mb-5 px-1 text-sm text-ink-500">
        {data.classroom.school_name && `${data.classroom.school_name} · `}
        담임 {data.teacherName} 선생님
      </p>

      <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* 공지사항 — 최신 세 개 미리보기 */}
        <Preview
          label="공지사항"
          to={ROUTES.classroomSection.notices}
          blank={notices.length === 0 ? '올라온 공지가 없어요.' : undefined}
        >
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link
                to={ROUTES.noticeDetail(notice.id)}
                className="flex items-center gap-2 py-1.5 transition-colors hover:text-brand-600"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{notice.title}</span>
                <span className="shrink-0 text-xs text-ink-400">
                  {notice.dueAt
                    ? relativeDayLabel(notice.dueAt)
                    : formatDate(notice.publishedAt, 'M월 d일')}
                </span>
              </Link>
            </li>
          ))}
        </Preview>

        {/* 학사일정 — 다가오는 세 개 미리보기 */}
        <Preview
          label="학사일정"
          to={ROUTES.classroomSection.schedule}
          blank={schedule.length === 0 ? '다가오는 일정이 없어요.' : undefined}
        >
          {schedule.map((item) => (
            <li key={`${item.date}-${item.title}`} className="flex items-center gap-2 py-1.5">
              <span
                className={cn(
                  'w-14 shrink-0 text-xs font-semibold',
                  item.date === todayIso ? 'text-danger' : 'text-brand-700',
                )}
              >
                {formatDate(`${item.date}T00:00:00`, 'M/d(E)')}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{item.title}</span>
              {item.isClassEvent && <span className="shrink-0 text-xs text-brand-700">학급</span>}
            </li>
          ))}
        </Preview>

        {/* 나머지는 줄만 */}
        {plainItems(data).map((item) => (
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

/** 제목 줄 + 더보기, 그 아래 미리보기 몇 줄. */
function Preview({
  label,
  to,
  blank,
  children,
}: {
  label: string
  to: string
  /** 보여줄 내용이 없을 때의 안내 문구 */
  blank?: string
  children: ReactNode
}) {
  return (
    <li className="border-b border-ink-100">
      <Link
        to={to}
        className="flex items-center gap-2 px-4 pb-1.5 pt-4 transition-colors hover:text-brand-600"
      >
        <span className="min-w-0 flex-1 text-[15px] font-medium text-ink-900">{label}</span>
        <span className="shrink-0 text-sm text-brand-500">더보기</span>
        <ChevronRight className="size-4 shrink-0 text-brand-500" aria-hidden />
      </Link>

      {blank ? (
        <p className="px-4 pb-3.5 text-sm text-ink-400">{blank}</p>
      ) : (
        <ul className="px-4 pb-3">{children}</ul>
      )}
    </li>
  )
}

/** 미리보기 없이 줄 하나로만 두는 항목. 요약은 안에 무엇이 있는지만 알려 준다. */
function plainItems(data: ClassroomBoard) {
  const dutyAreas = new Set(data.duties.map((duty) => duty.area)).size

  return [
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
      label: '학급규칙',
      to: ROUTES.classroomSection.rules,
      meta: count(data.rules.length, '개'),
    },
  ]
}

function count(value: number, unit: string) {
  return value > 0 ? `${value}${unit}` : '없음'
}
