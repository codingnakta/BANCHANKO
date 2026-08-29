import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from './database.types'

export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
