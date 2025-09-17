import { supabase } from '@/lib/supabase'

export async function leaveTeam(teamId: string) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
  if (error) throw error
}