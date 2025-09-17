import { supabase } from '@/lib/supabase'

export async function listRequests(teamId: string) {
  const { data, error } = await supabase
    .from('team_requests')
    .select('*')
    .eq('team_id', teamId)

  if (error) throw error
  return data
}
