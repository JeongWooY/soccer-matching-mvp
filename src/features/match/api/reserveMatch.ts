import { supabase } from '@/lib/supabase'

export async function reserveMatch(postId: string, requesterTeamId: string, message = '예약 신청합니다!') {
  const { error } = await supabase.from('match_reservations').insert({
    post_id: postId, requester_team_id: requesterTeamId, message
  })
  if (error) throw error
}
