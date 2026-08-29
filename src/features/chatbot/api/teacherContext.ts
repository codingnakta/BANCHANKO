import { fetchDuties, toDutyPlan, WEEKDAYS } from '@/features/teacher/api/settings'
import { fetchRoster } from '@/features/teacher/api/roster'
import { fetchMyClassroom } from '@/features/classroom/api/myClassroom'

export const teacherContextKeys = {
  all: ['chatTeacherContext'] as const,
  detail: (classroomId: string) => [...teacherContextKeys.all, classroomId] as const,
}

/**
 * 교사가 "월요일 복도 청소 김영우로 바꿔줘" 같은 부탁을 하려면
 * 모델이 지금의 구역·명단·규칙을 알고 있어야 한다.
 *
 * 학생 대화에는 넣지 않는다 (명단 전체는 교사만 볼 수 있는 정보다).
 */
export async function fetchTeacherFacts(classroomId: string): Promise<string[]> {
  const [dutyRows, roster, classroom] = await Promise.all([
    fetchDuties(classroomId),
    fetchRoster(classroomId),
    fetchMyClassroom(),
  ])

  const facts: string[] = []
  const plan = toDutyPlan(dutyRows)

  if (plan.areas.length > 0) {
    facts.push(`청소 구역: ${plan.areas.join(', ')}`)
    for (const day of WEEKDAYS) {
      const assigned = plan.areas
        .map((area, index) => `${area} — ${plan.names[day.value]?.[index] || '미지정'}`)
        .join(' / ')
      facts.push(`${day.label}요일 청소당번: ${assigned}`)
    }
  } else {
    facts.push('청소 구역: 아직 정한 것이 없음')
  }

  if (roster.length > 0) {
    facts.push(`학생 명단: ${roster.map((member) => member.name || member.email).join(', ')}`)
    const roles = roster.filter((member) => member.classRole)
    facts.push(
      roles.length > 0
        ? `1인1역: ${roles.map((member) => `${member.name} — ${member.classRole}`).join(', ')}`
        : '1인1역: 아직 정한 학생이 없음',
    )
  }

  if (classroom?.rules.length) {
    facts.push(`학급규칙: ${classroom.rules.map((rule, i) => `${i + 1}) ${rule}`).join(' ')}`)
  }

  return facts
}
