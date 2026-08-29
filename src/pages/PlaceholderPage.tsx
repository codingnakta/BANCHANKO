import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { ROUTES } from '@/constants'

interface PlaceholderPageProps {
  title: string
  /** 이 화면이 담당할 기능 — 구현 시 참고 */
  feature?: string
  /** 뒤로가기 목적지. 기본값은 우리반 탭 */
  backTo?: string
}

/** 아직 만들지 않은 화면의 자리. 실제 화면이 생기면 이 컴포넌트 사용을 지운다. */
export function PlaceholderPage({ title, feature, backTo = ROUTES.student.classroom }: PlaceholderPageProps) {
  return (
    <>
      <header className="mb-5 flex items-center gap-1">
        <Link
          to={backTo}
          aria-label="뒤로"
          className="-ml-2 rounded-full p-1.5 text-ink-700 transition-colors hover:bg-ink-100"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
      </header>

      <EmptyState message={feature ? `${feature} 화면 구현 예정입니다.` : '구현 예정입니다.'} />
    </>
  )
}
