import { formatDate, relativeDayLabel } from '@/lib/date'
import type { ScheduleItem } from '@/features/classroom/api/classroomBoard'

/** 근거로 실을 일정 수. 학년도 전체를 다 보내면 질문과 상관없는 줄이 너무 길어진다. */
const LIMIT = 20

/**
 * 학사일정을 근거 문장으로 바꾼다.
 *
 * 우리반 화면에 이미 공개된 것이라 학생 대화에도 넣는다.
 * (수련회·체육대회처럼 나이스 학사일정에만 있는 것을 물어볼 때 필요하다)
 */
export function scheduleFacts(schedule: ScheduleItem[]): string[] {
  if (schedule.length === 0) return []

  return [
    `학사일정: ${schedule
      .slice(0, LIMIT)
      .map(
        (item) =>
          `${formatDate(`${item.date}T00:00:00`)} ${item.title} (${relativeDayLabel(
            `${item.date}T00:00:00`,
          )})`,
      )
      .join(' / ')}`,
  ]
}
