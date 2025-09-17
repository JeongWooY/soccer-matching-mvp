import { supabase } from '@/lib/supabase'
import type { MatchPost } from '@/types/db'

export async function updateMatchPost(
  id: string,
  input: Partial<Pick<MatchPost, 'title' | 'content' | 'match_date' | 'location'>>
) {
  const { data, error } = await supabase
    .from('match_posts')
    .update({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.match_date !== undefined ? { match_date: input.match_date } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as MatchPost
}
