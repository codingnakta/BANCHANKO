import { Outlet } from 'react-router'
import { ChatFab } from '@/features/chatbot'
import { BottomTabBar } from './BottomTabBar'
import { SideNav } from './SideNav'

/**
 * 탭바가 있는 주요 화면(홈·할일·우리반·개인·학급운영)의 공통 셸.
 * 모바일은 하단 탭바, 데스크톱(md 이상)은 좌측 사이드바로 전환된다.
 * 원본 상세·작성/수정 화면은 DetailShell 을 사용한다.
 *
 * AI 챗봇 FAB도 여기에 두어, 탭바를 숨기는 화면에서는 함께 사라진다.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh bg-ink-50">
      <SideNav />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-4xl px-4 pt-4 pb-[calc(var(--spacing-tabbar)+5rem)] md:px-8 md:py-8 md:pb-24">
          <Outlet />
        </main>
      </div>
      <ChatFab />
      <BottomTabBar />
    </div>
  )
}
