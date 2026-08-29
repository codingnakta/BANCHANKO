import { useSyncExternalStore } from 'react'

/**
 * 홈에 띄울 항목 하나를 고르는 핀.
 *
 * 고른 사람 각자의 선택이라 이 기기에만 저장한다(localStorage).
 * 계정을 따라다니게 하려면 서버에 컬럼 하나를 두고 이 훅만 바꾸면 된다.
 */
const STORAGE_KEY = 'banchanko:pinnedPostId'

const listeners = new Set<() => void>()

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // 사생활 보호 모드 등 저장소를 못 쓰는 경우
    return null
  }
}

let current: string | null = read()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 같은 것을 다시 누르면 고정을 푼다. 하나만 고정된다. */
export function togglePinnedPost(postId: string) {
  current = current === postId ? null : postId
  try {
    if (current) localStorage.setItem(STORAGE_KEY, current)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장에 실패해도 이번 세션 동안은 선택이 유지된다
  }
  emit()
}

export function usePinnedPostId(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  )
}
