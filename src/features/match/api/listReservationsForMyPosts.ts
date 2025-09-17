import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/types/db'

export async function listReservationsForMyPosts(postId?: string) {
  let query = supabase.from('reservations').select('*').order('created_at', { ascending: false })

  if (postId) {
    query = query.eq('post_id', postId)
  }
  // RLS: 내가 작성한 글의 예약들만 보임
  const { data, error } = await query
  if (error) throw error
  return data as Reservation[]
}
