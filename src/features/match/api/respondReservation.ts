import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/types/db'

export async function respondReservation(
  reservationId: string,
  status: 'accepted' | 'rejected'
) {
  // 글 작성자만 update 가능 (RLS 정책에 따라 제한됨)
  const { data, error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', reservationId)
    .select()
    .single()

  if (error) throw error
  return data as Reservation
}