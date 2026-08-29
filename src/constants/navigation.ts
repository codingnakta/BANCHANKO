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
 * 하단 탭은 홈 → 할일 → 우리반 → 개인 네 개다.
 * 역할에 따라 홈 경로만 다르고, 학급 운영 기능은 우리반 안에 들어 있다.
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
]

export function tabsForRole(role: UserRole | null): TabItem[] {
  return role === 'teacher' ? TEACHER_TABS : STUDENT_TABS
}
