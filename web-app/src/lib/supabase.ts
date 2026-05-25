import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'
import { supabaseAuthOptions } from './supabase-auth-options'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!env.isConfigured()) {
      throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    }
    client = createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
      auth: supabaseAuthOptions,
    })
  }
  return client
}
