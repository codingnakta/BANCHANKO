import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { fetchPinnedPostId, pinnedPostKeys, savePinnedPostId } from '../api/pinnedPost'

/**
 * 홈에 띄울 글 하나를 고르는 핀.
 *
 * 사람마다 다른 선택이라 계정(profiles.pinned_post_id)에 저장한다.
 * 같은 것을 다시 누르면 고정이 풀리고, 하나만 고정된다.
 */
export function usePinnedPost() {
  const userId = useCurrentUser()?.id ?? ''
  const queryClient = useQueryClient()
  const key = pinnedPostKeys.mine(userId)

  const { data: pinnedId = null } = useQuery({
    queryKey: key,
    queryFn: () => fetchPinnedPostId(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: (next: string | null) => savePinnedPostId(userId, next),
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
    toggle: (postId: string) => {
      if (!userId) return
      mutation.mutate(pinnedId === postId ? null : postId)
    },
  }
}
