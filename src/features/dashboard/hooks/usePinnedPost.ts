import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { fetchPinnedId, pinnedKeys, savePinnedId, type PinColumn } from '../api/pinnedPost'

/**
 * 홈에 띄울 것 하나를 고르는 핀.
 *
 * 사람마다 다른 선택이라 계정(profiles)에 저장한다.
 * 같은 것을 다시 누르면 고정이 풀리고, 종류마다 하나씩만 고정된다.
 */
function usePin(column: PinColumn) {
  const userId = useCurrentUser()?.id ?? ''
  const queryClient = useQueryClient()
  const key = pinnedKeys.mine(userId, column)

  const { data: pinnedId = null } = useQuery({
    queryKey: key,
    queryFn: () => fetchPinnedId(userId, column),
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: (next: string | null) => savePinnedId(userId, column, next),
    // 누르는 즉시 색이 바뀌어야 한다
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string | null>(key) ?? null
      queryClient.setQueryData(key, next)
      return { previous }
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(key, context?.previous ?? null)
    },
  })

  return {
    pinnedId,
    toggle: (id: string) => {
      if (!userId) return
      mutation.mutate(pinnedId === id ? null : id)
    },
  }
}

/** 학급 과제 핀 (파란색) */
export function usePinnedPost() {
  return usePin('pinned_post_id')
}

/** 내 할일 핀 (핑크색) */
export function usePinnedTodo() {
  return usePin('pinned_todo_id')
}
