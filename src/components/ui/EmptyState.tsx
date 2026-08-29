import type { ReactNode } from 'react'

interface EmptyStateProps {
  /** 요약 데이터가 없을 때 표시할 안내 문구 */
  message: string
  action?: ReactNode
}

/** 데이터 없음 상태. 명세상 근거 없는 정보를 임의로 채우지 않고 빈 상태를 표시한다. */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-ink-300 px-4 py-10 text-center">
      <p className="text-sm text-ink-500">{message}</p>
      {action}
    </div>
  )
}
