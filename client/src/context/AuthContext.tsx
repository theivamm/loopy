import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { CoupleSpace, Profile } from '../types/db'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  space: CoupleSpace | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [space, setSpace] = useState<CoupleSpace | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfileAndSpace(user: User) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    setProfile(profileData as Profile | null)

    const { data: membership } = await supabase
      .from('memberships')
      .select('space_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membership) {
      const { data: spaceData } = await supabase
        .from('couple_spaces')
        .select('*')
        .eq('id', membership.space_id)
        .maybeSingle()
      setSpace(spaceData as CoupleSpace | null)
    } else {
      setSpace(null)
    }
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    if (data.session?.user) {
      await loadProfileAndSpace(data.session.user)
    }
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        await loadProfileAndSpace(data.session.user)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        await loadProfileAndSpace(newSession.user)
      } else {
        setProfile(null)
        setSpace(null)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, space, loading, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
