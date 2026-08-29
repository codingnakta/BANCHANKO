import { Outlet } from 'react-router'

/**
 * 원본 상세 화면·작성/수정 화면의 셸.
 * 규칙(F-ZYSPUS): 이 화면들에서는 하단 탭바를 표시하지 않는다.
 */
export function DetailShell() {
  return (
    <div className="min-h-dvh bg-ink-50">
      <main className="mx-auto w-full max-w-3xl px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
