import { supabase } from '@/lib/supabase'
import type { MatchPost, Reservation } from '@/types/db'

export type MatchPostDetail = MatchPost & { reservations: Reservation[] }

export async function getMatchPostById(id: string): Promise<MatchPostDetail> {
  const { data: post, error: postErr } = await supabase
    .from('match_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (postErr) throw postErr
  if (!post) throw new Error('게시글을 찾을 수 없습니다.')

  const { data: reservations, error: resErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  if (resErr) throw resErr

  return {
    ...(post as MatchPost),
    reservations: reservations ?? []   // ✅ undefined 방지
  }
}
