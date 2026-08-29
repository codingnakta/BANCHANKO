import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { SubPageShell } from '@/components/layout'
import { Card, Spinner } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useIsTeacher } from '@/features/auth/hooks/useCurrentUser'
import { useClassroomBoard } from '@/features/classroom'
import type { ClassroomBoard } from '@/features/classroom/api/classroomBoard'

interface ClassroomSectionShellProps {
  title: string
  description?: string
  /** 교사에게만 보이는 편집 링크 */
  edit?: { to: string; label: string }
  children: (data: ClassroomBoard) => ReactNode
}

/**
 * 우리반 목록에서 들어온 화면의 공통 껍데기.
 * 데이터 조회·로딩·오류를 한곳에서 처리하고, 본문만 각 화면이 그린다.
 */
export function ClassroomSectionShell({
  title,
  description,
  edit,
  children,
}: ClassroomSectionShellProps) {
  const isTeacher = useIsTeacher()
  const { data, isPending, isError, error, refetch } = useClassroomBoard()

  return (
    <SubPageShell
      title={title}
      description={description}
      backTo={ROUTES.classroom}
      action={
        edit && isTeacher ? (
          <Link
            to={edit.to}
            className="mt-1 shrink-0 text-sm font-medium text-brand-500 hover:underline"
          >
            {edit.label}
          </Link>
        ) : undefined
      }
    >
      {isPending ? (
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-ink-600">
            {error instanceof Error ? error.message : '학급 정보를 불러오지 못했습니다.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-sm font-medium text-brand-500 hover:underline"
          >
            다시 시도
          </button>
        </Card>
      ) : (
        children(data)
      )}
    </SubPageShell>
  )
}

/** 내용이 없을 때의 한 줄 안내. */
export function Blank({ children }: { children: ReactNode }) {
  return <p className="rounded-card bg-white px-4 py-3.5 text-sm text-ink-500">{children}</p>
}
