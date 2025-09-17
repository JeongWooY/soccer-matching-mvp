export type Team = {
  id: string
  name: string
  region: string | null
  bio: string | null
  created_by: string
  created_at: string
}

export type TeamMember = {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'member' | string
  created_at: string
}

export type TeamInvitation = {
  id: string
  team_id: string
  invited_email: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  invited_by: string | null
  created_at: string
}

export type TeamRequest = {
  id: string
  team_id: string
  requester_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}
