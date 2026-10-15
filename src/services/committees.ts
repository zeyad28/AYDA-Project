import { supabase } from '../lib/supabaseClient'
import type { Committee } from '../types'

export async function fetchCommittees(): Promise<Committee[]> {
  const { data, error } = await supabase
    .from('committees')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}
