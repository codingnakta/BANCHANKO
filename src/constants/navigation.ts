import { BunnyIcon, CatIcon, ChatIcon, HomeIcon } from '@/components/icons'
import { ROUTES } from './routes'
import type { UserRole } from '@/types'

export interface TabItem {
  key: string
  label: string
  path: string
  icon: typeof HomeIcon
}

/**
 * 하단 탭은 역할마다 다르다.
 *
 * 학생은 명세대로 홈 → 우리반 → 할일 → 더보기 네 개를 쓰고(F-ZYSPUS),
 * 교사에게는 '할일'(AI가 만든 학생용 오늘 할 일)이 의미가 없어 빼고 세 개만 둔다.
 */
const STUDENT_TABS: TabItem[] = [
  { key: 'home', label: '홈', path: ROUTES.student.home, icon: HomeIcon },
  { key: 'classroom', label: '우리반', path: ROUTES.classroom, icon: CatIcon },
  { key: 'todo', label: '할 일', path: ROUTES.student.todo, icon: ChatIcon },
  { key: 'more', label: '더보기', path: ROUTES.more, icon: BunnyIcon },
]

const TEACHER_TABS: TabItem[] = [
  { key: 'home', label: '홈', path: ROUTES.teacher.home, icon: HomeIcon },
  { key: 'classroom', label: '우리반', path: ROUTES.classroom, icon: CatIcon },
  { key: 'manage', label: '학급 운영', path: ROUTES.teacher.manage, icon: ChatIcon },
  { key: 'more', label: '더보기', path: ROUTES.more, icon: BunnyIcon },
]

export function tabsForRole(role: UserRole | null): TabItem[] {
  return role === 'teacher' ? TEACHER_TABS : STUDENT_TABS
}
