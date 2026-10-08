import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from '../context/AuthContext'

export function usePartner() {
  const { user, space } = useAuth()
  const userId = user?.id
  const spaceId = space?.id
  const [state, setState] = useState<{ spaceId?: string; hasPartner: boolean | null; error: boolean }>({ hasPartner: null, error: false })
  useEffect(() => {
    if (!userId || !spaceId) return
    let active = true
    let revision = 0
    async function load() {
      const current = ++revision
      const { data, error } = await supabase.from('memberships').select('user_id').eq('space_id', spaceId!).neq('user_id', userId!).limit(1)
      if (active && current === revision) setState({ spaceId, hasPartner: error ? null : Boolean(data?.length), error: Boolean(error) })
    }
    void load()
    const channel = supabase.channel(`partner-${spaceId}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `space_id=eq.${spaceId}` }, () => { void load() }).subscribe()
    const timer = window.setInterval(() => { void load() }, 15000)
    const refresh = () => { void load() }
    window.addEventListener('focus', refresh)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); void supabase.removeChannel(channel) }
  }, [userId, spaceId])
  return state.spaceId === spaceId ? state : { hasPartner: null, error: false }
}
