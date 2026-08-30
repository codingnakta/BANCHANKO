import { Link } from 'react-router'
import type { CleaningDuty } from '@/types'

interface TodayDutyCardProps {
  duties: CleaningDuty[]
  /** 교사에게만 — 당번을 고치러 가는 링크 */
  editTo?: string
}

/** 오늘 청소 당번 — 구역과 담당 학생. 교사·학생이 같은 것을 본다. */
export function TodayDutyCard({ duties, editTo }: TodayDutyCardProps) {
  return (
    <section>
      <div className="mb-2 flex items-baseline gap-3 px-1">
        <h2 className="text-xl font-semibold text-ink-900">오늘 청소 당번</h2>
        {editTo && (
          <Link to={editTo} className="ml-auto text-sm font-medium text-brand-500 hover:underline">
            설정
          </Link>
        )}
      </div>

      {duties.length === 0 ? (
        <p className="rounded-card bg-white px-4 py-4 text-sm text-ink-500 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          오늘 당번이 없어요.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {duties.map((duty) => (
            <li
              key={duty.id}
              className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 last:border-0"
            >
              <span className="w-20 shrink-0 truncate text-[15px] font-medium text-ink-900">
                {duty.area}
              </span>
              <span className="min-w-0 flex-1 text-[15px] text-ink-600">
                {duty.studentNames.join(', ') || '미지정'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
