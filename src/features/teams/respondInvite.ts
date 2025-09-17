import { supabase } from '@/lib/supabase'

export async function respondInvite(inviteId: string, action: 'accepted' | 'rejected') {
  if (action === 'accepted') {
    const { error } = await supabase.rpc('accept_invitation', { p_invite_id: inviteId })
    if (error) throw error
    return { status: 'accepted' as const }
  } else {
    const { error } = await supabase.rpc('reject_invitation', { p_invite_id: inviteId })
    if (error) throw error
    return { status: 'rejected' as const }
  }
}
