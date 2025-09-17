import { supabase } from '@/lib/supabase'

export async function sendInvitation(teamId: string, invitedEmail: string, invitedBy: string) {
  const { data, error } = await supabase
    .from('team_invitations')
    .insert({
      team_id: teamId,
      invited_email: invitedEmail,
      invited_by: invitedBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
