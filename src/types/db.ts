export type Profile = {
  id: string
  nickname: string | null
  created_at: string
}

export type MatchPost = {
  id: string
  title: string
  content: string | null
  match_date: string | null   // timestamptz ISO
  location: string | null
  created_at: string
  created_by: string | null   // profiles.id
}

export type Reservation = {
  id: string
  post_id: string
  requester_id: string
  status: 'requested' | 'accepted' | 'rejected' | 'canceled'
  created_at: string
}
