import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** 구글 공식 G 마크 (4색). 브랜드 가이드상 색을 임의로 바꾸지 않는다. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

/**
 * 구글로 시작하기 버튼 (UI 전용).
 * OAuth 연동은 아직 붙이지 않았다 — 연결 시 onClick 에서
 * supabase.auth.signInWithOAuth({ provider: 'google' }) 를 호출한다.
 */
export function GoogleButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-14 w-full items-center justify-center gap-3 rounded-full',
        'border border-ink-200 bg-white text-base font-medium text-ink-800',
        'shadow-sm transition-colors hover:bg-ink-50 active:bg-ink-100',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <GoogleMark className="size-5 shrink-0" />
      구글로 시작하기
    </button>
  )
}
