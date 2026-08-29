import { useCallback, useState } from 'react'
import { useDashboard } from '@/features/dashboard'
import { answerQuestion } from '../api/answerQuestion'
import { DEFAULT_MASCOT } from '../constants'
import type { ChatMessage } from '@/types'

let counter = 0
const nextId = () => `m${++counter}`

/**
 * 챗봇 대화 상태 (F-CCZIQT).
 *
 * TODO: Supabase 연동 시 질문·답변·참조 출처·생성 시각을 기록해야 한다.
 *       (AI 질의 기록은 생성일로부터 90일 보관 — F-ETJOMB)
 */
export function useChat() {
  const { data: summary } = useDashboard()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isAnswering, setIsAnswering] = useState(false)

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || isAnswering || !summary) return

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'user', text: question, createdAt: new Date().toISOString() },
      ])
      setIsAnswering(true)

      try {
        const answer = await answerQuestion(question, summary)
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            text: answer.text,
            status: answer.status,
            sources: answer.sources,
            mascot: answer.mascot,
            createdAt: new Date().toISOString(),
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            text: '답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.',
            status: 'no_evidence',
            sources: [],
            mascot: DEFAULT_MASCOT,
            createdAt: new Date().toISOString(),
          },
        ])
      } finally {
        setIsAnswering(false)
      }
    },
    [isAnswering, summary],
  )

  return { messages, isAnswering, send, isReady: !!summary }
}
