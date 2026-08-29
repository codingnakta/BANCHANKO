import { SUGGESTION_CHIPS } from '../constants'

interface SuggestionChipsProps {
  onPick: (question: string) => void
  disabled?: boolean
}

/**
 * 입력창 바로 위에 계속 떠 있는 키워드 추천 칩.
 * 첫 화면에서 추천 질문을 고른 뒤에도 답변 가능한 범위를 계속 알려준다.
 * 개수가 늘어도 줄바꿈 대신 가로 스크롤로 처리한다.
 */
export function SuggestionChips({ onPick, disabled }: SuggestionChipsProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex w-max gap-1.5">
        {SUGGESTION_CHIPS.map((chip) => (
          <li key={chip.keyword}>
            <button
              type="button"
              onClick={() => onPick(chip.question)}
              disabled={disabled}
              className="whitespace-nowrap rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 disabled:hover:border-ink-200 disabled:hover:bg-white disabled:hover:text-ink-600"
            >
              {chip.keyword}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
