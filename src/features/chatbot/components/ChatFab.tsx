import { Link } from 'react-router'
import { Sparkles } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'

/**
 * AI 챗봇 진입 버튼 (F-CCZIQT).
 *
 * 하단 탭바는 홈·할일·우리반·더보기 네 개로 고정이고 더보기 탭에는
 * 학급 운영 기능을 넣을 수 없어, 챗봇 진입점이 정의돼 있지 않다.
 * 그래서 탭바 위에 뜨는 플로팅 버튼으로 제공한다.
 *
 * - 교사·학생 모두 쓴다. 교사에게는 공지·과제 등록 초안까지 만들어 준다.
 * - AppShell 안에 두어, 탭바를 숨기는 상세·작성 화면에서는 함께 사라진다.
 */
export function ChatFab() {
  const role = useCurrentUser()?.role
  if (role !== 'student' && role !== 'teacher') return null

  return (
    <Link
      to={ROUTES.chat}
      aria-label="AI에게 물어보기"
      className="fixed right-4 z-50 flex size-14 items-center justify-center rounded-full bg-brand-400 text-white shadow-lg shadow-brand-400/30 transition-colors hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 bottom-[calc(var(--spacing-tabbar)+1rem+env(safe-area-inset-bottom))] md:bottom-6 md:right-6"
    >
      <Sparkles className="size-6" strokeWidth={2.2} aria-hidden />
    </Link>
  )
}
