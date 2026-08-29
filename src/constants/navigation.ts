import { BunnyIcon, CatIcon, ChatIcon, HomeIcon, ManageIcon } from '@/components/icons'
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
 * 학생은 홈 → 할일 → 우리반 → 개인 네 개,
 * 교사는 여기에 '학급운영'을 더해 다섯 개를 쓴다.
 */
const STUDENT_TABS: TabItem[] = [
  { key: 'home', label: '홈', path: ROUTES.student.home, icon: HomeIcon },
  { key: 'todo', label: '할일', path: ROUTES.todo, icon: ChatIcon },
  { key: 'classroom', label: '우리반', path: ROUTES.classroom, icon: CatIcon },
  { key: 'more', label: '개인', path: ROUTES.more, icon: BunnyIcon },
]

const TEACHER_TABS: TabItem[] = [
  { key: 'home', label: '홈', path: ROUTES.teacher.home, icon: HomeIcon },
  { key: 'todo', label: '할일', path: ROUTES.todo, icon: ChatIcon },
  { key: 'classroom', label: '우리반', path: ROUTES.classroom, icon: CatIcon },
  { key: 'more', label: '개인', path: ROUTES.more, icon: BunnyIcon },
  { key: 'manage', label: '학급운영', path: ROUTES.teacher.manage, icon: ManageIcon },
]

export function tabsForRole(role: UserRole | null): TabItem[] {
  return role === 'teacher' ? TEACHER_TABS : STUDENT_TABS
}
