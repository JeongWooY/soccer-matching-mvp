import { supabase } from '@/lib/supabase'
import type { MatchPost } from '@/types/db'

export async function createMatchPost(input: {
  title: string
  content?: string
  match_date?: string | null
  location?: string | null
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('match_posts')
    .insert({
      title: input.title,
      content: input.content ?? null,
      match_date: input.match_date ?? null,
      location: input.location ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as MatchPost
}
