import { supabase } from '@/lib/supabase'
import type { CommentReaction } from '@/types/db'

export type ReactionAgg = { emoji: string; count: number; reactedByMe: boolean }

export async function listCommentReactions(commentId: string) {
  const [{ data, error }, { data: me }] = await Promise.all([
    supabase.from('comment_reactions').select('*').eq('comment_id', commentId),
    supabase.auth.getUser(),
  ])
  if (error) throw error
  const uid = me.user?.id
  const arr = (data ?? []) as CommentReaction[]
  const map = new Map<string, ReactionAgg>()
  for (const r of arr) {
    const prev = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, reactedByMe: false }
    prev.count += 1
    if (uid && r.user_id === uid) prev.reactedByMe = true
    map.set(r.emoji, prev)
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}
