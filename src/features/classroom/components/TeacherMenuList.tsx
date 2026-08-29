import { Link } from 'react-router'
import {
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Megaphone,
  Settings,
  Users,
} from 'lucide-react'
import { ROUTES } from '@/constants'

interface MenuItem {
  label: string
  description: string
  to: string
  icon: typeof Users
  /** 우측에 표시할 보조 정보 */
  meta?: string
}

interface TeacherMenuListProps {
  studentCount: number
}

/**
 * 담임교사용 학급 운영 메뉴 (F-ZYSPUS).
 * 명세가 정한 다섯 항목: 학생 관리, 학급 기본 정보, 안내 관리, 시간표·급식 검수, 출결 기록.
 * 이 메뉴는 학생에게 표시하지 않는다.
 */
export function TeacherMenuList({ studentCount }: TeacherMenuListProps) {
  const items: MenuItem[] = [
    {
      label: '학생 관리',
      description: '학생 초대·등록과 소속 관리',
      to: ROUTES.members,
      icon: Users,
      meta: `${studentCount}명`,
    },
    {
      label: '학급 기본 정보',
      description: '학급명·규칙·시간표·청소 당번',
      to: ROUTES.classroomSettings,
      icon: Settings,
    },
    {
      label: '안내 관리',
      description: '공지·가정통신문·과제 일정 발행',
      to: ROUTES.noticeCreate,
      icon: Megaphone,
    },
    {
      label: '시간표·급식 검수',
      description: '연동 정보를 확인하고 공개',
      to: ROUTES.syncReview,
      icon: ClipboardList,
    },
    {
      label: '출결 기록',
      description: '학생별 출결과 변경 이력',
      to: ROUTES.attendance,
      icon: CalendarCheck,
    },
  ]

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">학급 운영</h2>

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
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
                <p className="mt-0.5 text-xs text-ink-500">{item.description}</p>
              </div>
              {item.meta && (
                <span className="shrink-0 text-sm font-medium text-ink-500">{item.meta}</span>
              )}
              <ChevronRight className="size-5 shrink-0 text-ink-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
