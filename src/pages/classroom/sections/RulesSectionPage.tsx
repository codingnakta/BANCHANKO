import { ROUTES } from '@/constants'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

/** 우리반 › 학급규칙 — 교사가 정한 규칙 목록. */
export function RulesSectionPage() {
  return (
    <ClassroomSectionShell title="학급규칙" edit={{ to: ROUTES.teacher.settings, label: '수정' }}>
      {(data) =>
        data.rules.length === 0 ? (
          <Blank>정해진 규칙이 없어요.</Blank>
        ) : (
          <ol className="overflow-hidden rounded-card bg-white">
            {data.rules.map((rule, index) => (
              <li
                key={rule}
                className="flex gap-3 border-b border-ink-100 px-4 py-3.5 last:border-0"
              >
                <span className="shrink-0 text-sm font-bold text-brand-500">{index + 1}</span>
                <span className="text-sm text-ink-800">{rule}</span>
              </li>
            ))}
          </ol>
        )
      }
    </ClassroomSectionShell>
  )
}
