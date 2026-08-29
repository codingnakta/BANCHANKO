import { BunnyIcon, CatIcon, ChatIcon, HomeIcon } from '@/components/icons'
import { ROUTES } from './routes'
import type { UserRole } from '@/types'

export interface TabItem {
  key: string
  label: string
  path: string
  icon: typeof HomeIcon
  /** 표시 대상 역할 — 미지정 시 학생·교사 모두 */
  roles?: UserRole[]
}

/** 탭 순서는 홈 → 우리반 → 할일 → 더보기로 고정한다. (F-ZYSPUS 규칙) */
export const TAB_ITEMS: TabItem[] = [
  { key: 'home', label: '홈', path: ROUTES.home, icon: HomeIcon },
  { key: 'classroom', label: '우리반', path: ROUTES.classroom, icon: CatIcon },
  { key: 'todo', label: '할 일', path: ROUTES.todo, icon: ChatIcon },
  { key: 'more', label: '더보기', path: ROUTES.more, icon: BunnyIcon },
]
