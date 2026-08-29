import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { WEEKDAYS, type DutyPlan } from '../api/settings'
import { cn } from '@/lib/utils'

interface DutyEditorProps {
  plan: DutyPlan
  onChange: (plan: DutyPlan) => void
}

/**
 * 청소 당번 편집기.
 *
 * 구역은 학급이 정해두는 것이라 모든 요일이 함께 쓴다.
 * 요일 탭을 옮기면 구역은 그대로 있고 담당 학생만 그 요일 것으로 바뀐다.
 * 저장은 화면 상단의 저장 버튼이 다섯 요일을 한 번에 처리한다.
 */
export function DutyEditor({ plan, onChange }: DutyEditorProps) {
  const [weekday, setWeekday] = useState<number>(WEEKDAYS[0].value)
  const names = plan.names[weekday] ?? []

  /** 구역은 모든 요일에 걸쳐 있으므로 이름 배열도 함께 맞춰준다. */
  function addArea() {
    onChange({
      areas: [...plan.areas, ''],
      names: Object.fromEntries(
        WEEKDAYS.map((day) => [day.value, [...(plan.names[day.value] ?? []), '']]),
      ),
    })
  }

  function removeArea(index: number) {
    onChange({
      areas: plan.areas.filter((_, i) => i !== index),
      names: Object.fromEntries(
        WEEKDAYS.map((day) => [
          day.value,
          (plan.names[day.value] ?? []).filter((_, i) => i !== index),
        ]),
      ),
    })
  }

  function setArea(index: number, value: string) {
    const areas = [...plan.areas]
    areas[index] = value
    onChange({ ...plan, areas })
  }

  function setName(index: number, value: string) {
    const next = [...names]
    next[index] = value
    onChange({ ...plan, names: { ...plan.names, [weekday]: next } })
  }

  return (
    <div>
      {/* 요일 탭 — 담당을 채워둔 요일에 점을 찍는다 */}
      <div className="mb-3 flex gap-1.5" role="tablist" aria-label="요일 선택">
        {WEEKDAYS.map((day) => {
          const filled = (plan.names[day.value] ?? []).some((name) => name.trim())
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
                active ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
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

      {plan.areas.length === 0 ? (
        <p className="rounded-xl bg-ink-50 px-4 py-5 text-center text-sm text-ink-500">
          청소 구역을 먼저 추가해주세요.
        </p>
      ) : (
        <>
          <div className="mb-1.5 flex gap-2 px-1">
            <span className="w-28 shrink-0 text-xs font-medium text-ink-500">구역 (요일 공통)</span>
            <span className="text-xs font-medium text-ink-500">
              {WEEKDAYS.find((day) => day.value === weekday)?.label}요일 담당
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {plan.areas.map((area, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  value={area}
                  onChange={(event) => setArea(index, event.target.value)}
                  placeholder="복도"
                  aria-label={`${index + 1}번째 구역 이름`}
                  className="w-28 shrink-0 bg-ink-50"
                />
                <Input
                  value={names[index] ?? ''}
                  onChange={(event) => setName(index, event.target.value)}
                  placeholder="홍길동, 김민준"
                  aria-label={`${area || `${index + 1}번째 구역`} 담당 학생`}
                />
                <button
                  type="button"
                  onClick={() => removeArea(index)}
                  aria-label={`${area || `${index + 1}번째 구역`} 삭제`}
                  className="mt-1.5 shrink-0 rounded-full p-2 text-ink-400 transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <Button variant="ghost" size="md" className="mt-2" onClick={addArea}>
        <Plus className="size-4" />
        구역 추가
      </Button>

      <p className="mt-2 px-1 text-xs leading-relaxed text-ink-500">
        구역은 모든 요일이 함께 써요. 요일을 바꾸면 담당 학생만 새로 입력하면 됩니다.
        <br />
        학생 이름은 쉼표로 구분해주세요.
      </p>
    </div>
  )
}
