import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { fetchMealByDate, mealKeys } from '@/features/classroom/api/mealByDate'
import { formatDate, getTodayIso } from '@/lib/date'
import type { ClassroomBoard } from '@/features/classroom/api/classroomBoard'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

/** 우리반 › 급식 — 날짜를 하루씩 넘겨 가며 본다. */
export function MealSectionPage() {
  const today = getTodayIso()
  const [date, setDate] = useState(today)

  const move = (days: number) =>
    setDate((current) => format(addDays(parseISO(current), days), 'yyyy-MM-dd'))

  return (
    <ClassroomSectionShell title="급식">
      {(data) => (
        <>
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="하루 전"
              className="rounded-full p-2 text-ink-500 transition-colors hover:bg-ink-100"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>

            <p className="flex-1 text-center text-[15px] font-semibold text-ink-900">
              {formatDate(`${date}T00:00:00`, 'M월 d일 (E)')}
              {date === today && <span className="ml-1.5 text-xs text-brand-500">오늘</span>}
            </p>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label="하루 뒤"
              className="rounded-full p-2 text-ink-500 transition-colors hover:bg-ink-100"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>

          <DayMeal classroom={data.classroom} date={date} />

          {date !== today && (
            <button
              type="button"
              onClick={() => setDate(today)}
              className="mt-3 w-full text-center text-sm font-medium text-brand-500 hover:underline"
            >
              오늘로
            </button>
          )}
        </>
      )}
    </ClassroomSectionShell>
  )
}

/** 그날 하루치 메뉴 */
function DayMeal({ classroom, date }: { classroom: ClassroomBoard['classroom']; date: string }) {
  const { data: items, isPending } = useQuery({
    queryKey: mealKeys.onDate(classroom.id, date),
    queryFn: () => fetchMealByDate(classroom, date),
    // 지난 날짜의 급식은 바뀌지 않는다
    staleTime: 10 * 60_000,
  })

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return <Blank>이 날은 급식 정보가 없어요. (주말이거나 학교가 올리지 않은 날)</Blank>
  }

  return (
    <ul className="overflow-hidden rounded-card bg-white">
      {items.map((item) => (
        <li
          key={item}
          className="border-b border-ink-100 px-4 py-3 text-[15px] text-ink-900 last:border-0"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}
