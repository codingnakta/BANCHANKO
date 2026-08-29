import { NavLink } from 'react-router'
import { TAB_ITEMS } from '@/constants'
import { cn } from '@/lib/utils'

/**
 * 모바일 전용 하단 탭바 (F-ZYSPUS).
 * 시안대로 다크 바 위에 흰색 아이콘, 활성 탭만 브랜드 블루로 표시한다.
 * 데스크톱(md 이상)에서는 SideNav 가 같은 역할을 하므로 숨긴다.
 */
export function BottomTabBar() {
  return (
    <nav
      aria-label="주요 화면 이동"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 bg-nav md:hidden"
    >
      <ul className="flex h-tabbar items-stretch">
        {TAB_ITEMS.map((tab) => (
          <li key={tab.key} className="flex-1">
            <NavLink
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1.5 text-xs font-medium transition-colors',
                  isActive ? 'text-brand-600' : 'text-white/95',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <tab.icon />
                  <span className={cn(!isActive && 'text-nav-muted')}>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
