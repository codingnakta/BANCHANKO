import { useEffect } from 'react'
import { X } from 'lucide-react'
import { LegalDocument } from './LegalDocument'

interface LegalDialogProps {
  title: string
  text: string
  onClose: () => void
}

/**
 * 약관을 그 자리에서 띄우는 팝업.
 *
 * 로그인 화면에서 약관을 보려고 화면을 떠나면 진행하던 로그인이 끊기므로,
 * 뒤를 흐리게 덮는 팝업으로 보여주고 닫으면 원래 자리로 돌아온다.
 */
export function LegalDialog({ title, text, onClose }: LegalDialogProps) {
  // 열려 있는 동안 Esc 로 닫고, 뒤 화면은 스크롤되지 않게 한다
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-card bg-white shadow-xl"
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

        <div className="overflow-y-auto px-5 py-4">
          <LegalDocument text={text} />
        </div>

        <footer className="border-t border-ink-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            확인
          </button>
        </footer>
      </div>
    </div>
  )
}
