import { useQuery } from '@tanstack/react-query'
import { fetchMySeat, mySeatKeys } from '../api/mySeat'
import { useCurrentUser } from './useCurrentUser'

/** 명단에 적힌 내 학번·이름. 교사이거나 아직 명단에 없으면 null. */
export function useMySeat() {
  const user = useCurrentUser()

  return useQuery({
    queryKey: mySeatKeys.mine(user?.id ?? 'none'),
    queryFn: fetchMySeat,
    enabled: Boolean(user?.classroomId),
    staleTime: 5 * 60_000,
  })
}
