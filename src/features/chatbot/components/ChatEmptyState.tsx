import dogMascot from '@/assets/mascots/dog.png'
import { useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { SUGGESTED_QUESTIONS, TEACHER_SUGGESTED_QUESTIONS } from '../constants'

interface ChatEmptyStateProps {
  onPick: (question: string) => void
}

/** 대화 시작 전 화면. 답변 가능한 범위를 예시 질문으로 알린다. */
export function ChatEmptyState({ onPick }: ChatEmptyStateProps) {
  const isTeacher = useIsTeacher()
  const questions = isTeacher ? TEACHER_SUGGESTED_QUESTIONS : SUGGESTED_QUESTIONS

  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <img src={dogMascot} alt="" draggable={false} className="h-20 w-auto select-none" />
      <div>
        <p className="text-lg font-semibold text-ink-900">무엇이 궁금한가요?</p>
        <p className="mt-1.5 text-sm text-ink-500">
          {isTeacher
            ? '우리 반 정보를 알려드리고, 공지·과제 초안도 만들어 드려요.'
            : '우리 반의 시간표·급식·청소 당번·과제·공지·일정을 알려드려요.'}
        </p>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {questions.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onPick(question)}
              className="w-full rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
