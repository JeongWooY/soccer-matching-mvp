import { supabase } from '@/lib/supabase'
import { Team } from './types'

export async function createTeam(payload: { name: string; region?: string; bio?: string; userId: string }) {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: payload.name,
      region: payload.region ?? null,
      bio: payload.bio ?? null,
      created_by: payload.userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as Team
}
