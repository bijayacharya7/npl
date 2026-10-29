import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as localAuth from '../lib/store/localAuth.js'
import { isLocalDemoMode } from '../lib/store/index.js'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export const authMode = isLocalDemoMode ? 'local' : isSupabaseConfigured ? 'supabase' : 'disabled'

async function userFromSupabase(authUser) {
  if (!authUser || !supabase) return null
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (error) {
    console.error('[NPL Fan Zone] Could not verify the account role:', error)
    return {
      id: authUser.id,
      email: authUser.email,
      displayName: authUser.user_metadata?.display_name ?? authUser.email,
      role: null,
      isAdmin: false,
      mode: 'supabase',
    }
  }

  const role = data?.role ?? null
  return {
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.user_metadata?.display_name ?? authUser.email,
    role,
    isAdmin: role === 'admin',
    mode: 'supabase',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!isLocalDemoMode) return null
    const session = localAuth.getSession()
    return session ? { ...session, isAdmin: true, mode: 'local' } : null
  })
  const [loading, setLoading] = useState(authMode === 'supabase')

  useEffect(() => {
    if (authMode !== 'supabase' || !supabase) {
      setLoading(false)
      return undefined
    }

    let active = true
    const hydrate = async (session) => {
      try {
        const nextUser = await userFromSupabase(session?.user)
        if (active) setUser(nextUser)
      } catch (error) {
        console.error('[NPL Fan Zone] Could not verify the account role:', error)
        if (active) setUser(null)
      }
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) console.error('[NPL Fan Zone] Could not restore the admin session:', error)
        return hydrate(data?.session)
      })
      .catch((error) => {
        console.error('[NPL Fan Zone] Could not restore the admin session:', error)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Run role lookup after Supabase releases its auth lock.
      Promise.resolve().then(() => hydrate(session))
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async ({ id, email, password }) => {
    if (authMode === 'local') {
      const session = await localAuth.signIn({ id, email, password })
      const nextUser = { ...session, isAdmin: true, mode: 'local' }
      setUser(nextUser)
      return nextUser
    }

    if (authMode !== 'supabase' || !supabase) {
      throw new Error('Admin sign-in is unavailable until Supabase is configured.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email ?? id ?? '').trim(),
      password,
    })
    if (error) throw new Error('Could not sign in. Check the email and password.')

    const nextUser = await userFromSupabase(data.user)
    if (!nextUser?.isAdmin) {
      await supabase.auth.signOut()
      setUser(null)
      throw new Error('This account does not have administrator access.')
    }

    setUser(nextUser)
    return nextUser
  }, [])

  const signOut = useCallback(async () => {
    if (authMode === 'local') localAuth.signOut()
    else if (authMode === 'supabase' && supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error('Could not sign out. Please try again.')
    }
    setUser(null)
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    if (authMode !== 'supabase' || !supabase) {
      throw new Error('Password reset is unavailable until Supabase is configured.')
    }
    const { error } = await supabase.auth.resetPasswordForEmail(String(email ?? '').trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    if (error) throw new Error(error.message)
  }, [])

  const refresh = useCallback(async () => {
    if (authMode === 'local') {
      const session = localAuth.getSession()
      setUser(session ? { ...session, isAdmin: true, mode: 'local' } : null)
      return
    }
    if (authMode === 'supabase' && supabase) {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      setUser(await userFromSupabase(data.session?.user))
    } else setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refresh, requestPasswordReset, authMode }),
    [user, loading, signIn, signOut, refresh, requestPasswordReset],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
