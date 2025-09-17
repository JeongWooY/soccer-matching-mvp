import { supabase } from '@/lib/supabase'

export async function changeMemberRole(teamId: string, memberId: string, role: 'owner' | 'member') {
  const { error } = await supabase.rpc('change_member_role', {
    p_team_id: teamId,
    p_member_id: memberId,
    p_role: role,
  })
  if (error) throw error
}
