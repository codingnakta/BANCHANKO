import { Link } from 'react-router'
import { ROUTES } from '@/constants'
import { Button } from '@/components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-brand-500">404</p>
      <p className="text-ink-600">요청한 화면을 찾을 수 없습니다.</p>
      <Link to={ROUTES.root}>
        <Button>홈으로</Button>
      </Link>
    </div>
  )
}
