import { supabase } from '../lib/supabaseClient'

export async function signInAdmin(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut()
}

// True when the signed-in user is in the public.admins allow-list.
// Returns null when the check cannot run (e.g. the DB migration adding
// is_admin() has not been applied yet) so callers can degrade gracefully.
export async function checkIsAdmin(): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) return null
  return Boolean(data)
}
