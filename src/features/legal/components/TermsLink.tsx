import { useState } from 'react'
import { termsText } from '../terms'
import { LegalDialog } from './LegalDialog'

/**
 * 누르면 약관 팝업을 여는 링크.
 * 로그인 화면처럼 화면을 떠나면 안 되는 자리에서 쓴다.
 */
export function TermsLink({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'font-medium text-brand-600 underline underline-offset-2'}
      >
        이용약관
      </button>
      {open && (
        <LegalDialog title="이용약관" text={termsText()} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
