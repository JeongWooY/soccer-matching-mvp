import { supabase } from '@/lib/supabase'

export type MyInviteRow = {
  id: string
  team_id: string
  invited_email: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  team?: { id: string; name: string | null } | null // 단일 객체로 사용
}

/**
 * 내 이메일로 받은 팀 초대 목록
 * @param userEmail 현재 로그인 사용자 이메일 (권장: useAuth().user.email 전달)
 */
export async function listMyInvites(userEmail: string) {
  const { data, error } = await supabase
    .from('team_invitations')
    // 🔑 alias를 team:teams 로 바꿔 단일 객체를 기대
    .select('id, team_id, invited_email, status, created_at, team:teams(id, name)')
    .eq('invited_email', userEmail)
    .order('created_at', { ascending: false })

  if (error) throw error

  // 🔧 드라이버/메타 상황에 따라 배열로 올 수 있어 방어적으로 평탄화
  const normalized = (data ?? []).map((r: any) => ({
    ...r,
    team: Array.isArray(r.team) ? (r.team[0] ?? null) : (r.team ?? null),
  }))

  // TS2352 방지: unknown 거쳐 단언
  return normalized as unknown as MyInviteRow[]
}
