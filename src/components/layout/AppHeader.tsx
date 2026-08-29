import { Link } from 'react-router'
import bellIcon from '@/assets/icons/bell.svg'
import heartIcon from '@/assets/icons/heart.svg'
import { ROUTES } from '@/constants'

interface AppHeaderProps {
  /** 하트 로고와 함께 크게 보여줄 문구 — 학급명이나 인사말 */
  heading?: string
  /** 로고 없이 제목만 보여줄 때 (할일·더보기 탭 등) */
  title?: string
  hasUnreadNotification?: boolean
}

/** 상단 헤더 — 하트 로고 + 학급명, 우측 알림 벨(미확인 시 점 표시). */
export function AppHeader({ heading, title, hasUnreadNotification }: AppHeaderProps) {
  return (
    <header className="mb-5 flex items-center gap-2.5">
      {title ? (
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
      ) : (
        <>
          <img src={heartIcon} alt="" className="h-5 w-auto shrink-0" draggable={false} />
          <h1 className="text-xl font-semibold text-ink-900">{heading}</h1>
        </>
      )}

      <Link
        to={ROUTES.notifications}
        className="relative ml-auto rounded-full p-1.5 transition-opacity hover:opacity-70"
        aria-label={hasUnreadNotification ? '알림 (읽지 않음 있음)' : '알림'}
      >
        <img src={bellIcon} alt="" className="h-6 w-auto" draggable={false} />
        {hasUnreadNotification && (
          <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-brand-400 ring-2 ring-ink-50" />
        )}
      </Link>
    </header>
  )
}
