import { supabase } from '@/lib/supabase'

export type MentionUser = { id: string; nickname: string | null; email: string | null }

export async function searchProfiles(q: string): Promise<MentionUser[]> {
  const query = q.trim()
  if (!query) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, auth:auth_users(email)')
    .ilike('nickname', `%${query}%`)
    .limit(5)

  // auth_users(email) 조인은 프로젝트마다 권한 이슈가 있으니,
  // 안 되면 프로필에 email 컬럼을 따로 두거나 닉네임만 사용하세요.
  if (error) {
    // fallback: 닉네임만
    const { data: d2, error: e2 } = await supabase
      .from('profiles')
      .select('id, nickname')
      .ilike('nickname', `%${query}%`)
      .limit(5)
    if (e2) throw e2
    return (d2 ?? []).map((r: any) => ({ id: r.id, nickname: r.nickname ?? null, email: null }))
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    nickname: r.nickname ?? null,
    email: r.auth?.email ?? null,
  }))
}
