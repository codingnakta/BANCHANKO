import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** 화면을 덮는 팝업. 뒤를 누르거나 Esc 로 닫는다. */
export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-card bg-white shadow-xl sm:rounded-card"
      >
        <header className="flex items-center gap-3 border-b border-ink-200 px-5 py-3.5">
          <h2 className="min-w-0 flex-1 text-base font-bold text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-1.5 rounded-full p-1.5 text-ink-500 transition-colors hover:bg-ink-100"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
