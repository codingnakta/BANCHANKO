import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { ROUTES } from '@/constants'

interface TeacherPageShellProps {
  title: string
  description?: string
  /** 헤더 오른쪽 (저장 버튼 등) */
  action?: ReactNode
  backTo?: string
  children: ReactNode
}

/** 교사 운영 화면 공통 껍데기 — 뒤로가기 + 제목 + 본문. */
export function TeacherPageShell({
  title,
  description,
  action,
  backTo = ROUTES.teacher.manage,
  children,
}: TeacherPageShellProps) {
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
