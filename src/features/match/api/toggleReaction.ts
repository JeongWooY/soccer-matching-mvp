import { supabase } from '@/lib/supabase'

export async function toggleReaction(commentId: string, emoji: string) {
  const { data: me, error: e1 } = await supabase.auth.getUser()
  if (e1) throw e1
  const uid = me.user?.id
  if (!uid) throw new Error('로그인이 필요합니다.')

  // 이미 있는지 확인
  const { data: exist, error: e2 } = await supabase
    .from('comment_reactions')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', uid)
    .eq('emoji', emoji)
    .maybeSingle()
  if (e2) throw e2

  if (exist) {
    const { error } = await supabase.from('comment_reactions').delete().eq('id', exist.id)
    if (error) throw error
    return { action: 'removed' as const }
  } else {
    const { error } = await supabase
      .from('comment_reactions')
      .insert({ comment_id: commentId, user_id: uid, emoji })
    if (error) throw error
    return { action: 'added' as const }
  }
}
