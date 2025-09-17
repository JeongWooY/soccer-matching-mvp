import { supabase } from '@/lib/supabase'

export async function cancelReservation(reservationId: string) {
  // 신청자 본인만 삭제 가능(RLS)
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)

  if (error) throw error
}