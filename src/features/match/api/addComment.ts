// src/features/match/api/addComment.ts
import { supabase } from '@/lib/supabase'
import type { Comment } from '@/types/db'

export async function addComment(postId: string, content: string): Promise<Comment> {
  // 현재 로그인 유저 가져오기
  const { data: userData, error: uerr } = await supabase.auth.getUser()
  if (uerr) throw uerr
  const userId = userData.user?.id
  if (!userId) throw new Error('로그인이 필요합니다.')

  // author_id를 함께 삽입해야 RLS 통과
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, content, author_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as Comment
}
