import { supabase } from '@/lib/supabase'

export async function listInvitations(teamId: string) {
  const { data, error } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('team_id', teamId)

  if (error) throw error
  return data
}
