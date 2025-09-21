import { supabase } from '@/lib/supabase'
import type { MatchPost } from '@/types/db'

export type PostFilters = {
  q?: string
  region?: string
  dateFrom?: string   // ISO (YYYY-MM-DD)
  dateTo?: string     // ISO
  sort?: 'latest' | 'dateAsc' | 'dateDesc'
  page?: number
  pageSize?: number
}

export async function listMatchPostsFiltered({
  q = '',
  region,
  dateFrom,
  dateTo,
  sort = 'latest',
  page = 0,
  pageSize = 9,
}: PostFilters) {
  let query = supabase.from('match_posts').select('*', { count: 'exact' })

  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
  }
  if (region) {
    query = query.ilike('location', `%${region}%`)
  }
  if (dateFrom) query = query.gte('match_date', dateFrom)
  if (dateTo) query = query.lte('match_date', dateTo)

  if (sort === 'latest') query = query.order('created_at', { ascending: false })
  if (sort === 'dateAsc') query = query.order('match_date', { ascending: true, nullsFirst: true })
  if (sort === 'dateDesc') query = query.order('match_date', { ascending: false, nullsFirst: true })

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)
  if (error) throw error

  return {
    items: (data ?? []) as MatchPost[],
    total: count ?? (data?.length ?? 0),
  }
}
