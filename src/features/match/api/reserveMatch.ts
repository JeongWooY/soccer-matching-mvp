import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/types/db'

export async function reserveMatch(postId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      post_id: postId,
      requester_id: user.id, // RLS with check(requester_id = auth.uid())
      status: 'requested'
    })
    .select()
    .single()
  if (error) throw error
  return data as Reservation
}
