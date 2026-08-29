import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { ROUTES } from '@/constants'

interface SubPageShellProps {
  title: string
  description?: string
  /** 헤더 오른쪽 (저장 버튼 등) */
  action?: ReactNode
  /** 뒤로가기로 돌아갈 곳 */
  backTo: string
  children: ReactNode
}

/** 하단 탭바 없이 뒤로가기 + 제목 + 본문으로 이루어진 하위 화면 껍데기. */
export function SubPageShell({
  title,
  description,
  action,
  backTo,
  children,
}: SubPageShellProps) {
  return (
    <>
      <header className="mb-5 flex items-start gap-1">
        <Link
          to={backTo}
          aria-label="뒤로"
          className="-ml-2 mt-0.5 rounded-full p-1.5 text-ink-700 transition-colors hover:bg-ink-100"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ink-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
        </div>
        {action}
      </header>

      {children}
    </>
  )
}

/** 교사 운영 화면 — 기본 뒤로가기만 '학급 운영'으로 다른 하위 화면. */
export function TeacherPageShell({
  backTo = ROUTES.teacher.manage,
  ...props
}: Omit<SubPageShellProps, 'backTo'> & { backTo?: string }) {
  return <SubPageShell backTo={backTo} {...props} />
}
