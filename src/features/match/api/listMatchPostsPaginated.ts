import { supabase } from '@/lib/supabase'
import type { MatchPost } from '@/types/db'

export async function listMatchPostsPaginated({
  pageIndex,      // 0부터 시작하는 페이지 인덱스
  pageSize,
}: {
  pageIndex: number
  pageSize: number
}) {
  const from = pageIndex * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('match_posts')
    .select('*', { count: 'exact' }) // total 개수도 함께
    .order('match_date', { ascending: true, nullsFirst: true })
    .range(from, to) // REST offset/limit 대신 range 사용 → 416 회피

  if (error) throw error

  const items = (data ?? []) as MatchPost[]
  const total = typeof count === 'number' ? count : items.length

  return { items, total }
}
