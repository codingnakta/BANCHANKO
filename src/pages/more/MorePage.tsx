import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout'
import { Badge, Button, Input, Modal } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useAuth } from '@/features/auth/hooks/useCurrentUser'
import { useMySeat } from '@/features/auth/hooks/useMySeat'
import { updateMyName } from '@/features/auth/api/mySeat'
import { useClassroom } from '@/features/classroom'
import { useNotifications } from '@/features/notifications'
import { aboutText, LegalDialog, privacyText, termsText } from '@/features/legal'
import type { UserRole } from '@/types'

const ROLE_LABEL: Record<UserRole, string> = {
  student: '학생',
  teacher: '담임교사',
}

/**
 * 더보기 탭 (F-ZYSPUS).
 * 내 학급·이름, 알림, 개인정보와 서비스 안내만 담는다.
 * 우리반과 같은 목록 모양을 쓴다 — 아이콘 없이 제목·요약·구분선.
 * 규칙상 학급 운영 기능은 이 탭에 포함하지 않는다.
 */
export function MorePage() {
  const { profile: user, signOut, refresh } = useAuth()
  // 명단에 적힌 학번·이름을 먼저 쓴다. 구글 계정 이름은 학급의 기준이 아니다.
  const { data: seat } = useMySeat()
  const isTeacher = user?.role === 'teacher'

  // 교사는 화면에 뜨는 이름을 직접 고친다. 학생 이름은 명단이 기준이라 못 고친다.
  const [editingName, setEditingName] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)

  async function saveName() {
    if (!user || editingName === null || !editingName.trim()) return
    setSavingName(true)
    try {
      await updateMyName(user.id, editingName)
      await refresh()
      setEditingName(null)
    } finally {
      setSavingName(false)
    }
  }
  const { data: classroom } = useClassroom()
  const { unreadCount } = useNotifications()

  // 약관·처리방침·소개처럼 팝업으로 여는 문서
  const [doc, setDoc] = useState<{ title: string; text: string } | null>(null)

  return (
    <>
      <AppHeader title="더보기" showBell={!isTeacher} hasUnreadNotification={unreadCount > 0} />

      {/* 내 정보 — 교사는 눌러서 이름을 고친다 */}
      <section className="mb-7 rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={() => isTeacher && setEditingName(user?.name ?? '')}
          disabled={!isTeacher}
          className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors enabled:hover:bg-brand-50"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
            {(seat?.name || user?.name)?.at(0)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-base font-semibold text-ink-900">
                {seat?.studentNo && <span className="mr-1.5 text-ink-500">{seat.studentNo}</span>}
                {seat?.name || user?.name}
              </span>
              {user?.role && <Badge tone="brand">{ROLE_LABEL[user.role]}</Badge>}
            </span>
            <span className="mt-0.5 block truncate text-sm text-ink-500">
              {classroom
                ? `${classroom.classroom.name} · 담임 ${classroom.classroom.teacherName} 선생님`
                : '학급 정보 불러오는 중'}
            </span>
          </span>
          {isTeacher && <ChevronRight className="size-5 shrink-0 text-ink-300" aria-hidden />}
        </button>
      </section>

      <div className="flex flex-col gap-7">
        {/* 알림은 학생만 쓴다. 교사는 자기가 올린 글이라 다시 알릴 것이 없다. */}
        {!isTeacher && (
          <Group title="알림">
            <MenuRow
              label="새 소식"
              to={ROUTES.notifications}
              meta={unreadCount > 0 ? `새 소식 ${unreadCount}` : '없음'}
            />
          </Group>
        )}

        <Group title="안내">
          <MenuRow
            label="개인정보 처리방침"
            onClick={() => setDoc({ title: '개인정보 처리방침', text: privacyText() })}
          />
          <MenuRow
            label="이용약관"
            onClick={() => setDoc({ title: '이용약관', text: termsText() })}
          />
          <MenuRow
            label="반창고 소개"
            onClick={() => setDoc({ title: '반창고 소개', text: aboutText() })}
          />
        </Group>

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

      {doc && <LegalDialog title={doc.title} text={doc.text} onClose={() => setDoc(null)} />}

      {editingName !== null && (
        <Modal title="이름 바꾸기" onClose={() => setEditingName(null)}>
          <p className="mb-3 text-xs text-ink-500">
            학생과 학부모에게 보이는 이름이에요. 처음에는 구글 계정 이름이 들어가 있어요.
          </p>
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            placeholder="김다연"
            autoFocus
          />
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => void saveName()}
              disabled={!editingName.trim() || savingName}
            >
              저장
            </Button>
            <Button variant="ghost" onClick={() => setEditingName(null)}>
              취소
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

/** 제목 하나에 줄 몇 개 — 우리반 목록과 같은 모양 */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-bold text-ink-900">{title}</h2>
      <ul className="overflow-hidden rounded-card bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {children}
      </ul>
    </section>
  )
}

/** 화면으로 이동하는 줄과 팝업을 여는 줄을 같은 모양으로 그린다. */
function MenuRow({
  label,
  meta,
  to,
  onClick,
}: {
  label: string
  meta?: string
  to?: string
  onClick?: () => void
}) {
  const className =
    'flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-brand-50'

  const inner = (
    <>
      <span className="min-w-0 flex-1 text-[15px] font-medium text-ink-900">{label}</span>
      {meta && <span className="shrink-0 text-sm text-ink-400">{meta}</span>}
      <ChevronRight className="size-5 shrink-0 text-ink-300" aria-hidden />
    </>
  )

  return (
    <li className="border-b border-ink-100 last:border-0">
      {to ? (
        <Link to={to} className={className}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {inner}
        </button>
      )}
    </li>
  )
}
