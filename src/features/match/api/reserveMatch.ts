import { supabase } from '@/lib/supabase';

type ReserveInput = {
  postId: string;                 // 예약할 게시글 id
  requesterTeamId?: string | null; // 신청자 팀 id (없으면 null 허용: 임시 테스트용)
  message?: string;               // 신청 메세지
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
      // status 기본값은 DB에서 'requested'
    })
    .select('id') // 방금 생성된 레코드 id만 반환
    .single();

  if (error) throw error;
  return { id: data!.id };
}
