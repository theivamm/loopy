import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { CoupleSpace, Profile } from '../types/db'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  space: CoupleSpace | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [workspace, setWorkspace] = useState<{ userId: string | null; profile: Profile | null; space: CoupleSpace | null; error: string | null }>({ userId: null, profile: null, space: null, error: null })
  const request = useRef(0)
  const userId = session?.user.id

  const loadProfileAndSpace = useCallback(async (id: string) => {
    const revision = ++request.current
    try {
      const [profileResult, membershipResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('memberships').select('space_id').eq('user_id', id).maybeSingle(),
      ])
      if (profileResult.error) throw profileResult.error
      if (membershipResult.error) throw membershipResult.error
      let space: CoupleSpace | null = null
      if (membershipResult.data) {
        const result = await supabase.from('couple_spaces').select('*').eq('id', membershipResult.data.space_id).single()
        if (result.error) throw result.error
        space = result.data as CoupleSpace
      }
      if (revision === request.current) setWorkspace({ userId: id, profile: profileResult.data as Profile | null, space, error: null })
    } catch {
      if (revision === request.current) setWorkspace((previous) => ({
        userId: id,
        profile: previous.userId === id ? previous.profile : null,
        space: previous.userId === id ? previous.space : null,
        error: 'No se pudo cargar tu espacio. Revisá tu conexión e intentá nuevamente.',
      }))
    }
  }, [])

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    setSession(data.session)
    if (data.session?.user) await loadProfileAndSpace(data.session.user.id)
  }, [loadProfileAndSpace])

  useEffect(() => {
    // No consultar Supabase dentro de este callback: el SDK mantiene su lock
    // de auth y puede bloquear la restauración o renovación de la sesión.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setAuthReady(true)
    })
    return () => { listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (userId) void loadProfileAndSpace(userId)
    return () => { request.current++ }
  }, [userId, loadProfileAndSpace])

  const ownsWorkspace = Boolean(userId && workspace.userId === userId)
  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null,
      profile: ownsWorkspace ? workspace.profile : null,
      space: ownsWorkspace ? workspace.space : null,
      loading: !authReady || Boolean(userId && !ownsWorkspace),
      error: ownsWorkspace ? workspace.error : null,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
