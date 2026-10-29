import { isSupabaseConfigured } from '../supabase.js'
import { localStore } from './local.js'
import { supabaseStore } from './supabaseStore.js'

// Use Supabase for authenticated edits, but keep the public site populated
// when a newly configured project has no seed rows yet.
export const isLocalDemoMode = import.meta.env.DEV && import.meta.env.VITE_LOCAL_DEMO !== 'false'
const resilientSupabaseStore =
  isSupabaseConfigured && !isLocalDemoMode
    ? {
        ...supabaseStore,
        async loadSnapshot() {
          try {
            const snapshot = await supabaseStore.loadSnapshot()
            if (snapshot.teams?.length || snapshot.matches?.length || snapshot.articles?.length) {
              return snapshot
            }
            console.warn('[NPL Fan Zone] Supabase is empty; using the bundled public snapshot.')
          } catch (error) {
            console.error('[NPL Fan Zone] Supabase snapshot unavailable; using the bundled public snapshot.', error)
          }
          return localStore.loadSnapshot()
        },
      }
    : null

export const store = resilientSupabaseStore ?? localStore
export const isDemoMode = store.mode === 'local'
