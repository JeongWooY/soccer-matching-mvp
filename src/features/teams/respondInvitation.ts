import { supabase } from '@/lib/supabase'

export async function respondInvitation(inviteId: string, status: 'accepted' | 'rejected') {
  const { data, error } = await supabase
    .from('team_invitations')
    .update({ status })
    .eq('id', inviteId)
    .select()
    .single()

  if (error) throw error
  return data
}
