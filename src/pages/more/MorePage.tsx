import { Link } from 'react-router'
import {
  Bell,
  ChevronRight,
  FileText,
  Info,
  LogOut,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Badge } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useAuth } from '@/features/auth/hooks/useCurrentUser'
import { useClassroom } from '@/features/classroom'
import { useNotifications } from '@/features/notifications'
import type { UserRole } from '@/types'

const ROLE_LABEL: Record<UserRole, string> = {
  student: '학생',
  teacher: '담임교사',
}

interface MenuItem {
  label: string
  description?: string
  to: string
  icon: typeof Bell
  /** 우측 배지 (미확인 알림 수 등) */
  badge?: number
}

/**
 * 더보기 탭 (F-ZYSPUS).
 * 내 학급·이름, 공지사항(알림), 계정과 개인정보 관리, 서비스 안내만 담는다.
 * 규칙상 학급 운영 기능은 이 탭에 포함하지 않는다.
 */
export function MorePage() {
  const { profile: user, signOut } = useAuth()
  const { data: classroom } = useClassroom()
  const { unreadCount } = useNotifications()

  // 첫 묶음은 한 줄뿐이라 제목 없이 바로 보여준다
  const groups: { title?: string; items: MenuItem[] }[] = [
    {
      items: [
        {
          label: '공지사항',
          description: '공지·과제·당번·행사 소식',
          to: ROUTES.notifications,
          icon: Bell,
          badge: unreadCount,
        },
      ],
    },
    {
      title: '계정과 개인정보',
      items: [
        {
          label: '계정 관리',
          description: '비밀번호 변경, 탈퇴',
          to: ROUTES.account,
          icon: UserRound,
        },
        {
          label: '개인정보 처리방침',
          description: '수집 항목과 보관 기간',
          to: ROUTES.about,
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: '서비스 안내',
      items: [
        { label: '이용약관', to: ROUTES.about, icon: FileText },
        { label: '반창고 소개', to: ROUTES.about, icon: Info },
      ],
    },
  ]

  return (
    <>
      <AppHeader title="더보기" hasUnreadNotification={unreadCount > 0} />

      {/* 프로필 */}
      <section className="mb-7 flex items-center gap-3.5 rounded-card bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
          {user?.name.at(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold text-ink-900">{user?.name}</p>
            {user?.role && <Badge tone="brand">{ROLE_LABEL[user.role]}</Badge>}
          </div>
          <p className="mt-0.5 truncate text-sm text-ink-500">
            {classroom ? `${classroom.classroom.name} · 담임 ${classroom.classroom.teacherName} 선생님` : '학급 정보 불러오는 중'}
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-7">
        {groups.map((group) => (
          <section key={group.title ?? group.items[0].label}>
            {group.title && (
              <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">{group.title}</h2>
            )}
            <ul className="flex flex-col gap-2">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="flex items-center gap-3.5 rounded-card bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:bg-brand-50"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <item.icon className="size-5" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-ink-900">{item.label}</p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-ink-500">{item.description}</p>
                      )}
                    </div>
                    {!!item.badge && item.badge > 0 && (
                      <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="size-5 shrink-0 text-ink-300" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <button
          type="button"
          onClick={signOut}
          className="flex items-center justify-center gap-2 rounded-card bg-white py-3.5 text-[15px] font-medium text-ink-600 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:text-ink-900"
        >
          <LogOut className="size-[18px]" strokeWidth={2} aria-hidden />
          로그아웃
        </button>

        <p className="text-center text-xs text-ink-400">반창고 v0.1.0</p>
      </div>
    </>
  )
}
