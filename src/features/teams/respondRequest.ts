import { supabase } from '@/lib/supabase'

export async function respondRequest(requestId: string, action: 'accepted' | 'rejected') {
  if (action === 'accepted') {
    const { error } = await supabase.rpc('accept_team_request', { p_request_id: requestId })
    if (error) throw error
    return { status: 'accepted' }
  } else {
    const { data, error } = await supabase
      .from('team_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
