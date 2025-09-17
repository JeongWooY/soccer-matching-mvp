import { supabase } from '@/lib/supabase';

export type Reservation = {
  id: string;
  post_id: string;
  requester_team_id: string | null;
  message: string | null;
  status: string;
};

export async function getReservationsByPost(postId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('match_reservations')
    .select('*')
    .eq('post_id', postId)
    .order('id', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Reservation[];
}
