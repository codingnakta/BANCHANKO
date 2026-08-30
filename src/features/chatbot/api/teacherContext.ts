import { fetchDuties, toDutyPlan, WEEKDAYS } from '@/features/teacher/api/settings'
import { fetchRoster, type RosterMember } from '@/features/teacher/api/roster'
import { fetchMyClassroom } from '@/features/classroom/api/myClassroom'
import { fetchNotices } from '@/features/teacher/api/notices'

export const teacherContextKeys = {
  all: ['chatTeacherContext'] as const,
  detail: (classroomId: string) => [...teacherContextKeys.all, classroomId] as const,
}

/**
 * 모델에게 보낼 학생 표시 이름.
 *
 * 이름이 비어 있어도 이메일로 대신하지 않는다. 이메일은 반에 공개된 정보가
 * 아니고, 청소당번·1인1역을 정하는 데 쓸 일도 없다.
 */
function displayName(member: RosterMember): string {
  const name = member.name.trim()
  if (name) return name
  const studentNo = member.studentNo.trim()
  return studentNo ? `${studentNo}번 학생` : '이름 미등록'
}

/**
 * 교사가 "월요일 복도 청소 김영우로 바꿔줘" 같은 부탁을 하려면
 * 모델이 지금의 구역·명단·규칙을 알고 있어야 한다.
 *
 * 학생 대화에는 넣지 않는다 (명단 전체는 교사만 볼 수 있는 정보다).
 *
 * 여기에 담는 것은 이름·구역·규칙처럼 반에서 오가는 말뿐이다.
 * 이메일·전화번호와 출결은 담지 않는다 — 모델이 알아야 할 일이 없고,
 * 외부(업스테이지)로 나가는 값이라 적을수록 좋다.
 */
export async function fetchTeacherFacts(classroomId: string): Promise<string[]> {
  const [dutyRows, roster, classroom, posts] = await Promise.all([
    fetchDuties(classroomId),
    fetchRoster(classroomId),
    fetchMyClassroom(),
    fetchNotices(classroomId),
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
    facts.push(`학생 명단: ${roster.map(displayName).join(', ')}`)
    const roles = roster.filter((member) => member.classRole)
    facts.push(
      roles.length > 0
        ? `1인1역: ${roles.map((member) => `${displayName(member)} — ${member.classRole}`).join(', ')}`
        : '1인1역: 아직 정한 학생이 없음',
    )
  }

  // 고칠 대상을 제목으로 짚을 수 있도록 올린 안내를 그대로 나열한다
  if (posts.length > 0) {
    facts.push(
      `올린 안내(제목 · 유형 · 날짜): ${posts
        .slice(0, 20)
        .map(
          (post) =>
            `${post.title} · ${post.type === 'assignment' ? '과제' : '공지'}${
              post.due_date ? ` · ${post.due_date}` : ''
            }`,
        )
        .join(' / ')}`,
    )
  }

  if (classroom?.rules.length) {
    facts.push(`학급규칙: ${classroom.rules.map((rule, i) => `${i + 1}) ${rule}`).join(' ')}`)
  }

  return facts
}
