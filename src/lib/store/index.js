import { isSupabaseConfigured } from '../supabase.js'
import { localStore } from './local.js'
import { supabaseStore } from './supabaseStore.js'

// Use the shared Supabase store when configured; otherwise keep the public
// deployment usable with the local read-only demo dataset.
export const isLocalDemoMode = import.meta.env.DEV && import.meta.env.VITE_LOCAL_DEMO !== 'false'
export const store = isSupabaseConfigured && !isLocalDemoMode ? supabaseStore : localStore
export const isDemoMode = store.mode === 'local'
