import { formatDate, isPast, relativeDayLabel } from '@/lib/date'
import { ROUTES } from '@/constants'
import type { ChatSource, DashboardSummary } from '@/types'

/**
 * 질문에 필요한 학급 데이터를 골라내는 층 (F-CCZIQT).
 *
 * 실제 LLM 을 붙이더라도 "이 질문에 어떤 학급 데이터를 넣을지" 고르는 일은
 * 그대로 필요하므로, 이 파일은 백엔드 전환 후에도 재사용한다.
 * 중요한 규칙: 학생이 볼 수 있는 데이터만 넘긴다. 미공개 연동 데이터(null)와
 * 비공개 일정은 애초에 summary 에 들어오지 않는다.
 *
 * 여기서 뽑는 것은 반에 이미 공개된 것뿐이다 — 시간표·급식·청소당번·과제·공지·일정.
 * 출결과 이메일·전화번호는 summary 에 들어 있지도 않고, 앞으로도 넣지 않는다.
 * facts 는 그대로 외부(업스테이지)로 나가므로 새 주제를 더할 때 이 선을 지킨다.
 */

/** 질문에서 찾아낸 주제 */
export type Topic = 'timetable' | 'meal' | 'cleaning' | 'assignment' | 'notice' | 'event'

const KEYWORDS: Record<Topic, string[]> = {
  timetable: ['시간표', '교시', '수업', '무슨 과목', '과목'],
  meal: ['급식', '점심', '메뉴', '밥', '식단'],
  cleaning: ['청소', '당번'],
  assignment: ['과제', '숙제', '수행평가', '마감', '제출'],
  notice: ['공지', '가정통신문', '안내', '알림'],
  event: ['행사', '일정', '체육대회', '시험', '중간고사', '기말', '준비물'],
}

/** 질문 문장에서 관련 주제를 뽑는다. 하나도 없으면 빈 배열. */
export function detectTopics(question: string): Topic[] {
  const q = question.replace(/\s+/g, '')
  return (Object.keys(KEYWORDS) as Topic[]).filter((topic) =>
    KEYWORDS[topic].some((kw) => q.includes(kw.replace(/\s+/g, ''))),
  )
}

export interface RetrievedContext {
  topics: Topic[]
  /** 주제별로 추린 사람이 읽을 수 있는 근거 문장 */
  facts: string[]
  sources: ChatSource[]
}

/**
 * 주제에 해당하는 학급 데이터를 근거 문장과 출처로 변환한다.
 * 데이터가 없으면 facts 가 비고, 호출부는 추정 답변을 만들지 않는다.
 */
export function retrieveContext(question: string, summary: DashboardSummary): RetrievedContext {
  const topics = detectTopics(question)
  const facts: string[] = []
  const sources: ChatSource[] = []

  for (const topic of topics) {
    switch (topic) {
      case 'timetable': {
        if (!summary.timetable?.length) break
        const filled = summary.timetable.filter((entry) => entry.subject)
        if (!filled.length) break
        facts.push(
          `오늘 시간표: ${filled
            .map((e) => `${e.periodLabel ?? `${e.period}교시`} ${e.subject}`)
            .join(', ')}`,
        )
        sources.push({ label: '오늘 시간표', updatedAt: new Date().toISOString() })
        break
      }
      case 'meal': {
        if (!summary.meal?.items.length) break
        facts.push(`오늘 급식: ${summary.meal.items.join(', ')}`)
        sources.push({ label: '오늘 급식', updatedAt: summary.meal.syncedAt })
        break
      }
      case 'cleaning': {
        if (!summary.cleaningDuties.length) break
        facts.push(
          `청소 당번: ${summary.cleaningDuties
            .map((d) => `${d.area} — ${d.studentNames.join(', ')}`)
            .join(' / ')}`,
        )
        sources.push({ label: '청소 당번', updatedAt: new Date().toISOString() })
        break
      }
      case 'assignment': {
        if (!summary.upcomingAssignments.length) break
        for (const a of summary.upcomingAssignments) {
          const due = a.dueAt ? ` (마감 ${formatDate(a.dueAt)}, ${relativeDayLabel(a.dueAt)})` : ''
          facts.push(`과제 "${a.title}"${due}`)
          sources.push({
            label: `과제: ${a.title}`,
            updatedAt: a.publishedAt,
            href: ROUTES.noticeDetail(a.id),
          })
        }
        break
      }
      case 'notice': {
        if (!summary.unreadNotices.length) break
        for (const n of summary.unreadNotices) {
          facts.push(`공지 "${n.title}" — ${n.body}`)
          sources.push({
            label: `공지: ${n.title}`,
            updatedAt: n.publishedAt,
            href: ROUTES.noticeDetail(n.id),
          })
        }
        break
      }
      case 'event': {
        // 지난 일정은 묻는 말과 상관없다
        const events = summary.upcomingEvents.filter((event) => !isPast(event.startAt))
        if (!events.length) break
        for (const e of events) {
          const desc = e.description ? ` — ${e.description}` : ''
          facts.push(`일정 "${e.title}" ${formatDate(e.startAt)} (${relativeDayLabel(e.startAt)})${desc}`)
          sources.push({
            label: `일정: ${e.title}`,
            updatedAt: e.startAt,
            href: undefined,
          })
        }
        break
      }
    }
  }

  return { topics, facts, sources }
}
