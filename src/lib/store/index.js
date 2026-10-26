import { isSupabaseConfigured } from '../supabase.js'
import { localStore } from './local.js'
import { supabaseStore } from './supabaseStore.js'

// The demo shortcut is available only during local development. Production
// always uses the shared Supabase store when configured and is read-only if not.
export const isLocalDemoMode = import.meta.env.DEV && import.meta.env.VITE_LOCAL_DEMO !== 'false'
export const store = isSupabaseConfigured && !isLocalDemoMode ? supabaseStore : localStore
export const isDemoMode = store.mode === 'local'
