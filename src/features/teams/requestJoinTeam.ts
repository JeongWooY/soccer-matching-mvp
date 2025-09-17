import { supabase } from '@/lib/supabase'

export async function requestJoinTeam(teamId: string, requesterId: string) {
  const { data, error } = await supabase
    .from('team_requests')
    .insert({ team_id: teamId, requester_id: requesterId })
    .select()
    .single()

  if (error) throw error
  return data
}
