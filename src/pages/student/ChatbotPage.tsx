import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { ROUTES } from '@/constants'
import {
  ChatEmptyState,
  ChatInput,
  MessageBubble,
  SuggestionChips,
  useChat,
} from '@/features/chatbot'

/**
 * AI 챗봇 (F-CCZIQT).
 * 학생의 소속 학급 데이터만 근거로 답하고, 답변에 출처와 최종 갱신 시각을 함께 표시한다.
 * 근거가 없거나 권한 밖 질문이면 추정하지 않고 답변 범위를 안내한다.
 */
export function ChatbotPage() {
  const { messages, isAnswering, send, isReady } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const started = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isAnswering])

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <header className="mb-4 flex items-center gap-1">
        <Link
          to={ROUTES.root}
          aria-label="뒤로"
          className="-ml-2 rounded-full p-1.5 text-ink-700 transition-colors hover:bg-ink-100"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
        <h1 className="text-xl font-semibold text-ink-900">무엇이든 물어보세요</h1>
      </header>

      <div className="flex-1">
        {started ? (
          <ul className="flex flex-col gap-4 pb-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isAnswering && (
              <li className="flex items-center gap-2 pl-10 text-sm text-ink-400">
                <span className="flex gap-1" aria-hidden>
                  <Dot delay="0ms" />
                  <Dot delay="150ms" />
                  <Dot delay="300ms" />
                </span>
                <span className="sr-only">답변을 준비하고 있어요</span>
              </li>
            )}
          </ul>
        ) : (
          <ChatEmptyState onPick={send} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 + 키워드 칩을 하단에 고정 */}
      <div className="safe-bottom [--safe-pb:0.75rem] sticky bottom-0 -mx-4 border-t border-ink-200 bg-ink-50/95 px-4 pt-2.5 backdrop-blur">
        {/* 대화가 시작된 뒤에도 답변 가능한 범위를 계속 노출한다 */}
        {started && <SuggestionChips onPick={send} disabled={isAnswering || !isReady} />}
        <ChatInput onSend={send} disabled={isAnswering || !isReady} />
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-ink-300"
      style={{ animationDelay: delay }}
    />
  )
}
