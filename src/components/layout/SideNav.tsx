import { NavLink } from 'react-router'
import { tabsForRole } from '@/constants'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { cn } from '@/lib/utils'

/**
 * 데스크톱(md 이상) 전용 좌측 내비게이션.
 * 하단 탭바와 동일한 4개 항목·순서·다크 톤을 유지한다. (F-ZYSPUS)
 */
export function SideNav() {
  const tabs = tabsForRole(useCurrentUser()?.role ?? null)

  return (
    <aside className="hidden w-60 shrink-0 bg-nav md:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-8 px-4 py-7">
        <p className="px-3 text-lg font-bold tracking-tight text-white">
          BANCHAN<span className="text-brand-600">KO</span>
        </p>
        <nav aria-label="주요 화면 이동">
          <ul className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <li key={tab.key}>
                <NavLink
                  to={tab.path}
                  end={tab.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-brand-600'
                        : 'text-white/80 hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  <tab.icon />
                  <span>{tab.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
