import { supabase } from '@/lib/supabase';

export async function updateReservationStatus(
  reservationId: string,
  status: 'accepted' | 'rejected'
) {
  // 1) 예약 상태 변경 + post_id, status 회수
  const { data: updated, error: upErr } = await supabase
    .from('match_reservations')
    .update({ status })
    .eq('id', reservationId)
    .select('id, post_id, status')
    .limit(1)
    .maybeSingle();

  if (upErr) throw upErr;
  if (!updated) throw new Error('예약을 찾지 못했거나 업데이트되지 않았습니다.');
  if (updated.status !== status) {
    throw new Error(`상태 업데이트 실패(현재:${updated.status}, 기대:${status})`);
  }

  // 2) 수락이면 글도 matched로
  if (status === 'accepted' && updated.post_id) {
    const { error: postErr } = await supabase
      .from('match_posts')
      .update({ status: 'matched' })
      .eq('id', updated.post_id);
    if (postErr) throw postErr;
  }

  return updated; // 필요하면 호출 쪽에서 바로 반영 가능
}
