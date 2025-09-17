import { supabase } from '@/lib/supabase';

type ReserveInput = {
  postId: string;
  requesterTeamId?: string | null;
  message?: string;
};

export async function reserveMatch({
  postId,
  requesterTeamId = null,
  message = '예약 신청합니다!',
}: ReserveInput): Promise<{ id: string }> {
  if (!postId) throw new Error('postId가 필요합니다.');

  const { data, error } = await supabase
    .from('match_reservations')
    .insert({
      post_id: postId,
      requester_team_id: requesterTeamId,
      message,
    })
    .select('id')          // ← 배열로 와도 OK
    .limit(1)              // ← 첫 행만
    .maybeSingle();        // ← 0/1행 안전 처리

  if (error) throw error;
  if (!data) throw new Error('예약 생성 결과가 비어 있습니다.');
  return { id: data.id };
}
