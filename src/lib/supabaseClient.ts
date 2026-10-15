import { createClient } from '@supabase/supabase-js'

// Vite only exposes env vars prefixed with VITE_ to the browser bundle.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'خطأ: يرجى التأكد من ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
