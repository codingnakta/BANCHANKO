import { EmptyState } from '@/components/ui'

interface ClassRulesCardProps {
  rules: string[]
}

/** 학급 규칙 (F-RONORQ). 교사만 등록·수정하고 학생은 조회만 한다. */
export function ClassRulesCard({ rules }: ClassRulesCardProps) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">학급 규칙</h2>

      {rules.length === 0 ? (
        <EmptyState message="등록된 학급 규칙이 없습니다." />
      ) : (
        <ol className="rounded-card bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {rules.map((rule, i) => (
            <li key={rule} className="flex items-start gap-3 py-2">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                {i + 1}
              </span>
              <span className="text-[15px] text-ink-900">{rule}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
