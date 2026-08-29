import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'

interface DateDialogProps {
  title: string
  /** yyyy-MM-dd. 없으면 빈 칸으로 연다 */
  value: string
  onSave: (value: string) => void
  onClose: () => void
  isSaving?: boolean
}

/** 날짜 하나만 고치는 작은 팝업. 카드에서 D-day 를 누르면 열린다. */
export function DateDialog({ title, value, onSave, onClose, isSaving }: DateDialogProps) {
  const [date, setDate] = useState(value)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xs rounded-card bg-white p-5 shadow-xl"
      >
        <h2 className="mb-3 text-base font-semibold text-ink-900">{title}</h2>

        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} autoFocus />

        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => onSave(date)} disabled={isSaving}>
            저장
          </Button>
          {value && (
            <Button variant="secondary" onClick={() => onSave('')} disabled={isSaving}>
              날짜 없음
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}
