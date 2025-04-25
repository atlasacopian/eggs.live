import { createClient } from '@supabase/supabase-js'

const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SB_SERVICE = process.env.SUPABASE_SERVICE_KEY

export const supabaseBrowser = () => {
  if (!SB_URL || !SB_ANON) throw new Error('Supabase env vars missing')
  return createClient(SB_URL, SB_ANON, { auth: { persistSession: false } })
}

export const supabaseServer = () => {
  if (!SB_URL || !SB_SERVICE) throw new Error('Supabase env vars missing')
  return createClient(SB_URL, SB_SERVICE)
} 