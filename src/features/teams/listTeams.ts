import { supabase } from '@/lib/supabase'
import { Team } from './types'

export async function listTeams({ from = 0, to = 20 }: { from?: number; to?: number }) {
  const { data, error, count } = await supabase
    .from('teams')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { items: (data ?? []) as Team[], total: count ?? 0 }
}
