import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const FIELD_BASE =
  'w-full rounded-xl border bg-white px-4 text-base text-ink-900 transition-colors ' +
  'placeholder:text-ink-400 focus:outline-2 focus:outline-offset-0 focus:outline-brand-500 ' +
  'disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        FIELD_BASE,
        'h-12',
        invalid ? 'border-danger' : 'border-ink-200',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export function Select({ className, invalid, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        FIELD_BASE,
        'h-12 appearance-none bg-[length:1rem] bg-[right:1rem_center] bg-no-repeat pr-10',
        // 화살표를 인라인 SVG 로 그려 아이콘 에셋 의존을 없앤다
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23909090'%3E%3Cpath d='M4 6l4 4 4-4'stroke='%23909090' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")]",
        invalid ? 'border-danger' : 'border-ink-200',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  /** 나란히 놓을 때 폭을 조절한다 */
  className?: string
  children: ReactNode
}

/** 라벨 + 입력 + 도움말/오류를 묶는 래퍼. */
export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="px-1 text-sm font-medium text-ink-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="px-1 text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="px-1 text-sm text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}
