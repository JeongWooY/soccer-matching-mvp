import { supabase } from '@/lib/supabase'

export async function cancelTeamRequest(requestId: string) {
  const { error } = await supabase
    .from('team_requests')
    .delete()
    .eq('id', requestId)

  if (error) throw error
}
