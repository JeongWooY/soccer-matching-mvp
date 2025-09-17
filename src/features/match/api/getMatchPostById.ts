import { supabase } from '@/lib/supabase'
import type { MatchPost } from '../types'

export async function getMatchPostById(id: string): Promise<MatchPost | null> {
  const { data, error } = await supabase
    .from('match_posts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as MatchPost
}
