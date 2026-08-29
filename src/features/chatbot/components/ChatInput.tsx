import { useState, type FormEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const canSend = value.trim().length > 0 && !disabled

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSend) return
    onSend(value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1.5 pl-4 pr-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="우리 반에 대해 물어보세요"
          aria-label="질문 입력"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="보내기"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
            canSend ? 'bg-brand-400 text-white hover:bg-brand-500' : 'bg-ink-200 text-ink-400',
          )}
        >
          <ArrowUp className="size-5" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </form>
  )
}
