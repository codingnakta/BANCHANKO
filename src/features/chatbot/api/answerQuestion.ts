import { supabase } from '@/lib/supabase'
import { getTodayIso } from '@/lib/date'
import {
  DEFAULT_MASCOT,
  MASCOT_BY_TOPIC,
  MASCOT_TOPIC_PRIORITY,
  type MascotKey,
} from '../constants'
import { retrieveContext, type Topic } from './retrieveContext'
import type { ChatAnswer, ChatDraft, DashboardSummary, UserRole } from '@/types'

/**
 * 질문 주제에 따라 답변을 맡을 마스코트를 고른다.
 * 여러 주제가 걸리면 MASCOT_TOPIC_PRIORITY 앞쪽이 이긴다.
 */
export function pickMascot(topics: Topic[]): MascotKey {
  const primary = MASCOT_TOPIC_PRIORITY.find((topic) => topics.includes(topic))
  return primary ? MASCOT_BY_TOPIC[primary] : DEFAULT_MASCOT
}

/**
 * 질문에 대한 답변을 만든다 (F-CCZIQT).
 *
 * 근거는 앱이 직접 뽑는다(retrieveContext). 그 근거만 들려 보내고
 * 문장은 업스테이지 Solar 가 만든다 — API 키를 브라우저에 둘 수 없어
 * Supabase Edge Function('chat')을 거친다.
 *
 * 교사가 "~ 공지로 등록해줘"라고 하면 등록 초안(draft)이 함께 온다.
 * 초안은 제안일 뿐이고, 실제 등록은 교사가 화면에서 눌러야 일어난다.
 *
 * 함수가 없거나(미배포) 키가 없으면 근거를 그대로 나열하는 방식으로 되돌아간다.
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
  role: UserRole | null = 'student',
): Promise<ChatAnswer> {
  const { topics, facts, sources } = retrieveContext(question, summary)

  // 교사의 등록 요청은 주제 판정에 걸리지 않아도 모델에게 넘긴다
  const generated = await generate(question, facts, role)
  if (generated) {
    return {
      status: facts.length > 0 ? 'answered' : 'no_evidence',
      text: generated.reply,
      sources: facts.length > 0 ? sources : [],
      mascot: pickMascot(topics),
      draft: generated.draft ?? undefined,
    }
  }

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

/** 업스테이지 Solar 호출. 실패하면 null 을 돌려 규칙 기반 답변으로 넘긴다. */
async function generate(
  question: string,
  facts: string[],
  role: UserRole | null,
): Promise<{ reply: string; draft: ChatDraft | null } | null> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      reply?: string
      draft?: ChatDraft | null
    }>('chat', {
      body: { question, role: role ?? 'student', facts, today: getTodayIso() },
    })

    if (error || !data?.reply) return null
    return { reply: data.reply, draft: data.draft ?? null }
  } catch {
    // 함수 미배포·네트워크 오류 — 조용히 규칙 기반으로 되돌아간다
    return null
  }
}
