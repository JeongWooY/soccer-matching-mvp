import { supabase } from '@/lib/supabase'
import type { MatchPost } from '../types'

export async function getMatchPosts(params: { city?: string; date?: string }): Promise<MatchPost[]> {
  let q = supabase.from('match_posts').select('*').order('date', { ascending: true })
  if (params.city) q = q.eq('city', params.city)
  if (params.date) q = q.eq('date', params.date)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as MatchPost[]
}
