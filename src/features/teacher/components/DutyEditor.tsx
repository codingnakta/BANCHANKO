import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { WEEKDAYS, type DutyPlan, type DutyRowInput } from '../api/settings'
import { cn } from '@/lib/utils'

interface DutyEditorProps {
  plan: DutyPlan
  onChange: (plan: DutyPlan) => void
}

/**
 * 청소 당번 편집기.
 *
 * 요일을 탭으로 고르고 그 요일의 구역을 여러 줄 넣는다.
 * 다섯 요일 전체를 한 상태(DutyPlan)로 들고 있어서 탭을 옮겨도 입력이 남는다.
 * 저장은 화면 상단의 저장 버튼이 한 번에 처리한다.
 */
export function DutyEditor({ plan, onChange }: DutyEditorProps) {
  const [weekday, setWeekday] = useState<number>(WEEKDAYS[0].value)
  const rows = plan[weekday] ?? []

  function update(next: DutyRowInput[]) {
    onChange({ ...plan, [weekday]: next })
  }

  return (
    <div>
      {/* 요일 탭 — 입력한 요일에 점을 찍어 어디를 채웠는지 보이게 한다 */}
      <div className="mb-3 flex gap-1.5" role="tablist" aria-label="요일 선택">
        {WEEKDAYS.map((day) => {
          const filled = (plan[day.value] ?? []).some(
            (row) => row.area.trim() || row.studentNames.trim(),
          )
          const active = day.value === weekday
          return (
            <button
              key={day.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setWeekday(day.value)}
              className={cn(
                'relative flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                active
                  ? 'bg-brand-500 text-white'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
              )}
            >
              {day.label}
              {filled && (
                <span
                  className={cn(
                    'absolute top-1.5 right-1.5 size-1.5 rounded-full',
                    active ? 'bg-white' : 'bg-brand-500',
                  )}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-ink-50 px-4 py-5 text-center text-sm text-ink-500">
          이 요일에 정해진 구역이 없어요.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-start gap-2">
              <Input
                value={row.area}
                onChange={(event) => {
                  const next = [...rows]
                  next[index] = { ...row, area: event.target.value }
                  update(next)
                }}
                placeholder="구역"
                aria-label={`${index + 1}번째 구역`}
                className="w-28 shrink-0"
              />
              <Input
                value={row.studentNames}
                onChange={(event) => {
                  const next = [...rows]
                  next[index] = { ...row, studentNames: event.target.value }
                  update(next)
                }}
                placeholder="홍길동, 김민준"
                aria-label={`${index + 1}번째 구역 담당 학생`}
              />
              <button
                type="button"
                onClick={() => update(rows.filter((_, i) => i !== index))}
                aria-label={`${index + 1}번째 구역 삭제`}
                className="mt-1.5 shrink-0 rounded-full p-2 text-ink-400 transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="md"
        className="mt-2"
        onClick={() => update([...rows, { area: '', studentNames: '' }])}
      >
        <Plus className="size-4" />
        구역 추가
      </Button>

      <p className="mt-2 px-1 text-xs text-ink-500">
        학생 이름은 쉼표로 구분해주세요. 요일을 옮겨도 입력한 내용은 그대로 남아요.
      </p>
    </div>
  )
}
