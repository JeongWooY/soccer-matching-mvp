import { supabase } from '@/lib/supabase'

export async function deleteMatchPost(id: string) {
  const { error } = await supabase.from('match_posts').delete().eq('id', id)

  if (error) throw error
  return true
}
