import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="불러오는 중"
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-ink-300 border-t-brand-500',
        className,
      )}
    />
  )
}
