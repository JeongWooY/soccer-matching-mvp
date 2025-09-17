import { supabase } from '@/lib/supabase'

type Input = {
  date: string
  start_time: string
  end_time: string
  venue: string
  city: string | null
  level: string | null
  fee_split: string | null
  openchat_url: string | null
}

export async function createMatchPost(input: Input) {
  // TODO: 실제 author_team_id는 로그인 사용자 팀에서 가져오기
  const { data: userData } = await supabase.auth.getUser()
  const author_team_id = userData.user?.id ?? null
  const { error } = await supabase.from('match_posts').insert({
    author_team_id, date: input.date, start_time: input.start_time, end_time: input.end_time,
    venue: input.venue, city: input.city, level: input.level, fee_split: input.fee_split,
    openchat_url: input.openchat_url
  })
  if (error) throw error
}
