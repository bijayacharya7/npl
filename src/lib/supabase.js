import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

const looksPlaceholder = (value) =>
  !value || value.includes('your-project') || value.includes('your-anon')

/**
 * Supabase is optional. When the two public environment variables are present
 * the app uses Supabase for auth and data; otherwise it runs in local demo mode.
 *
 * Only the public anon key belongs here. Row Level Security policies in
 * `supabase/migrations` are what actually protect the data.
 */
export const isSupabaseConfigured = !looksPlaceholder(url) && !looksPlaceholder(anonKey)

if (url && !anonKey) {
  console.warn(
    '[NPL Fan Zone] VITE_SUPABASE_URL is set but VITE_SUPABASE_ANON_KEY is missing. Falling back to local demo mode.',
  )
}
if (!url && anonKey) {
  console.warn(
    '[NPL Fan Zone] VITE_SUPABASE_ANON_KEY is set but VITE_SUPABASE_URL is missing. Falling back to local demo mode.',
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const MODE = isSupabaseConfigured ? 'supabase' : 'local'

export const MEDIA_BUCKET = 'npl-media'

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
