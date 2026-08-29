import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useDashboard } from '@/features/dashboard'
import { answerQuestion } from '../api/answerQuestion'
import { fetchTeacherFacts, teacherContextKeys } from '../api/teacherContext'
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
  const user = useCurrentUser()
  const role = user?.role ?? null
  const classroomId = user?.classroomId ?? ''
  const { data: summary } = useDashboard()

  // 교사에게만 — 청소 구역·학생 명단·학급규칙까지 근거에 넣는다
  const { data: teacherFacts } = useQuery({
    queryKey: teacherContextKeys.detail(classroomId),
    queryFn: () => fetchTeacherFacts(classroomId),
    enabled: role === 'teacher' && Boolean(classroomId),
    staleTime: 30_000,
  })
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
        // 이번 세션에서 오간 대화를 함께 넘겨 앞의 답을 기억하게 한다
        const answer = await answerQuestion(
          question,
          summary,
          role,
          teacherFacts ?? [],
          messages,
        )
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            text: answer.text,
            status: answer.status,
            sources: answer.sources,
            mascot: answer.mascot,
            action: answer.action,
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
    [isAnswering, messages, role, summary, teacherFacts],
  )

  return { messages, isAnswering, send, isReady: !!summary }
}
