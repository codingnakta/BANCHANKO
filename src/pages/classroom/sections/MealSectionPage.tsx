import { format } from 'date-fns'
import { formatDate } from '@/lib/date'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

/** 우리반 › 급식 — 오늘 급식 메뉴. */
export function MealSectionPage() {
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <ClassroomSectionShell title="급식" description={formatDate(`${today}T00:00:00`, 'M월 d일 (E)')}>
      {(data) =>
        !data.meal || data.meal.items.length === 0 ? (
          <Blank>오늘 급식 정보가 없어요.</Blank>
        ) : (
          <ul className="overflow-hidden rounded-card bg-white">
            {data.meal.items.map((item) => (
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
    </ClassroomSectionShell>
  )
}
