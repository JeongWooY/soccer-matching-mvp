import { supabase } from '@/lib/supabase'

export async function deleteTeam(teamId: string) {
  const { error } = await supabase.from('teams').delete().eq('id', teamId)
  if (error) throw error
}
