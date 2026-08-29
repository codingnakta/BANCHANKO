import { ROUTES } from '@/constants'
import { Blank, ClassroomSectionShell } from './ClassroomSectionShell'

/** 우리반 › 1인1역 — 학생이 맡은 역할. */
export function RolesSectionPage() {
  return (
    <ClassroomSectionShell title="1인1역" edit={{ to: ROUTES.teacher.students, label: '지정' }}>
      {(data) =>
        data.roles.length === 0 ? (
          <Blank>맡은 역할이 아직 없어요.</Blank>
        ) : (
          <ul className="overflow-hidden rounded-card bg-white">
            {data.roles.map((role) => (
              <li
                key={`${role.studentNo}-${role.name}`}
                className="flex items-center gap-3 border-b border-ink-100 px-4 py-3.5 last:border-0"
              >
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink-900">
                  {role.name}
                </span>
                <span className="shrink-0 text-sm text-ink-600">{role.role}</span>
              </li>
            ))}
          </ul>
        )
      }
    </ClassroomSectionShell>
  )
}
