import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/types/db'

export async function listMyReservations(): Promise<Reservation[]> {
  // RLS 정책: requester_id = auth.uid() 인 데이터만 보임
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Reservation[]
}
