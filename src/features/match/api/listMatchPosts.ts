import { supabase } from '@/lib/supabase'
import type { MatchPost } from '@/types/db'

export async function listMatchPosts(): Promise<MatchPost[]> {
  const { data, error } = await supabase
    .from('match_posts')
    .select('*')
    .order('match_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as MatchPost[]
}
