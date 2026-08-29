import { format } from 'date-fns'
import dogMascot from '@/assets/mascots/dog.png'
import type { TodayTask } from '@/types'

interface TodayHeroCardProps {
  tasks: TodayTask[]
  date?: Date
}

/**
 * "오늘 뭐 하지?" 카드 — 오늘 할 일을 모아 보여주는 대시보드 최상단 항목.
 * 근거 데이터가 없으면 항목을 임의로 만들지 않고 빈 상태를 표시한다. (F-NXPULH)
 *
 * 시안에는 우측에 할일 탭으로 가는 파란 원형 버튼이 있었지만, 할일은 이미
 * 하단 탭바에 있어 중복이고 AI 챗봇 FAB와 모양·색이 겹쳐서 뺐다.
 */
export function TodayHeroCard({ tasks, date = new Date() }: TodayHeroCardProps) {
  return (
    <section className="relative overflow-hidden rounded-card bg-brand-100 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-ink-900">오늘 뭐 하지?</h2>
        <p className="pt-1.5 text-sm font-light text-ink-900">{format(date, 'yyyy년 M월 d일')}</p>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          {tasks.length === 0 ? (
            <p className="py-3 text-base text-ink-600">오늘 예정된 할 일이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-2.5">
                  <span
                    className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand-500"
                    aria-hidden
                  />
                  <span className="text-base text-ink-900">{task.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <img src={dogMascot} alt="" className="h-16 w-auto shrink-0 select-none" draggable={false} />
      </div>
    </section>
  )
}
