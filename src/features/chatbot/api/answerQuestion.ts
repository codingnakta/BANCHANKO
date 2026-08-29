import {
  DEFAULT_MASCOT,
  MASCOT_BY_TOPIC,
  MASCOT_TOPIC_PRIORITY,
  type MascotKey,
} from '../constants'
import { retrieveContext, type Topic } from './retrieveContext'
import type { ChatAnswer, DashboardSummary } from '@/types'

/**
 * 질문 주제에 따라 답변을 맡을 마스코트를 고른다.
 * 여러 주제가 걸리면 MASCOT_TOPIC_PRIORITY 앞쪽이 이긴다.
 */
export function pickMascot(topics: Topic[]): MascotKey {
  const primary = MASCOT_TOPIC_PRIORITY.find((topic) => topics.includes(topic))
  return primary ? MASCOT_BY_TOPIC[primary] : DEFAULT_MASCOT
}

/**
 * 학생 질문에 대한 답변을 만든다 (F-CCZIQT).
 *
 * ⚠ 지금은 규칙 기반 임시 구현이다. 실제 답변은 Upstage Solar API 로 생성해야 하는데,
 *    API 키를 프론트엔드에 둘 수 없으므로 Supabase Edge Function 을 거쳐야 한다.
 *
 *    교체 지점은 이 함수 하나다. 아래처럼 바뀐다:
 *      const { data } = await supabase.functions.invoke('chat', { body: { question } })
 *    근거 검색(retrieveContext)과 마스코트 선택(pickMascot)은 그대로 재사용한다.
 *
 * 지키는 규칙:
 *  - 근거가 없으면 추정하지 않고 답변 가능 범위를 안내한다.
 *  - 학급 데이터 밖의 질문에는 범위를 제한해 안내한다.
 *  - 답변에는 참조한 출처와 최종 갱신 시각을 함께 반환한다.
 *  - 마스코트는 아바타만 바꾼다. 답변 내용은 캐릭터에 따라 달라지지 않는다.
 */
export async function answerQuestion(
  question: string,
  summary: DashboardSummary,
): Promise<ChatAnswer> {
  // 실제 호출의 지연을 흉내내 로딩 UI 를 확인할 수 있게 한다
  await new Promise((resolve) => setTimeout(resolve, 600))

  const { topics, facts, sources } = retrieveContext(question, summary)

  // 학급 데이터와 무관한 질문
  if (topics.length === 0) {
    return {
      status: 'out_of_scope',
      text: '저는 우리 반의 시간표, 급식, 청소 당번, 과제, 공지, 행사에 대해서만 답할 수 있어요. 그 밖의 내용은 담임 선생님께 여쭤봐 주세요.',
      sources: [],
      mascot: DEFAULT_MASCOT,
    }
  }

  // 주제는 맞지만 저장된 근거가 없는 경우 — 임의로 만들어내지 않는다
  if (facts.length === 0) {
    return {
      status: 'no_evidence',
      text: '아직 우리 반에 등록된 정보가 없어서 알려드릴 수 없어요. 선생님이 등록하시면 확인할 수 있습니다.',
      sources: [],
      mascot: pickMascot(topics),
    }
  }

  return {
    status: 'answered',
    text: facts.join('\n'),
    sources,
    mascot: pickMascot(topics),
  }
}
