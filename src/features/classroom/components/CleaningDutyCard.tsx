import { EmptyState } from '@/components/ui'
import type { CleaningDuty } from '@/types'

interface CleaningDutyCardProps {
  duties: CleaningDuty[]
}

/** 청소 당번 (F-RONORQ) */
export function CleaningDutyCard({ duties }: CleaningDutyCardProps) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">청소 당번</h2>

      {duties.length === 0 ? (
        <EmptyState message="지정된 청소 당번이 없습니다." />
      ) : (
        <ul className="rounded-card bg-white px-4 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {duties.map((duty) => (
            <li
              key={duty.id}
              className="flex items-start gap-3 border-b border-ink-100 py-3 last:border-0"
            >
              <span className="w-16 shrink-0 text-xs font-medium text-[#9b9b9b]">{duty.area}</span>
              <span className="text-[15px] text-ink-900">{duty.studentNames.join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
