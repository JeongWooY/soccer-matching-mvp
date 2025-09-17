import { useQuery } from '@tanstack/react-query'
import { getMatchPosts } from '../api/getMatchPosts'

export function useMatchPosts(params: { city?: string; date?: string }) {
  return useQuery({ queryKey: ['matchPosts', params], queryFn: () => getMatchPosts(params), staleTime: 30_000 })
}
