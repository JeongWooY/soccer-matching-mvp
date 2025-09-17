import { supabase } from '@/lib/supabase'

export async function listTeamMembers(teamId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, user_id, role, created_at')
    .eq('team_id', teamId)

  if (error) throw error
  return data
}
