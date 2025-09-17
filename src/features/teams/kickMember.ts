import { supabase } from '@/lib/supabase'

export async function kickMember(teamId: string, memberId: string) {
  const { error } = await supabase.rpc('kick_member', {
    p_team_id: teamId,
    p_member_id: memberId,
  })
  if (error) throw error
}
