import { supabase } from '@/lib/supabase'

export async function joinTeam(teamId: string, userId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .insert({ team_id: teamId, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}
