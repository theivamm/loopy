import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Icon, MOODS, MoodIcon, type IconName } from '../ui/Icon'
import { REACCIONES } from '../../lib/statusMeta'
import type { Reaction, Status, Touch } from '../../types/db'

interface Toast { id: number; icon: IconName | null; mood?: string | null; title: string; text?: string }

export function PartnerNotifier() {
  const { user, space } = useAuth()
  const [toasts, setToasts] = useState<Toast[]>([])
  const lastMood = useRef<string | null | undefined>(undefined)
  const lastMsg = useRef<string | null | undefined>(undefined)
  const seq = useRef(0)

  function push(t: Omit<Toast, 'id'>) {
    const id = ++seq.current
    setToasts((p) => [...p.slice(-2), { ...t, id }])
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 5500)
  }

  useEffect(() => {
    if (!space || !user) return
    const filter = `space_id=eq.${space.id}`
    const channel = supabase
      .channel(`notifier-${space.id}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses', filter }, (payload) => {
        const s = payload.new as Status
        if (!s || s.user_id === user.id) return
        const moodChanged = lastMood.current !== undefined && lastMood.current !== s.emoji
        const msgChanged = lastMsg.current !== undefined && lastMsg.current !== s.mensaje && !!s.mensaje
        if (moodChanged) {
          const label = MOODS.find((m) => m.key === s.emoji)?.label ?? 'distinto'
          push({ icon: null, mood: s.emoji, title: `Tu pareja ahora está ${label.toLowerCase()}`, text: s.mensaje ?? undefined })
        } else if (msgChanged) {
          push({ icon: 'estados', title: 'Tu pareja actualizó su estado', text: s.mensaje ?? undefined })
        }
        lastMood.current = s.emoji
        lastMsg.current = s.mensaje
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'thinking_touches', filter }, (payload) => {
        const t = payload.new as Touch
        if (t.user_id === user.id) return
        push({ icon: 'heart', title: t.mensaje && t.mensaje !== 'Pensando en vos' ? t.mensaje : 'Tu pareja está pensando en vos' })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'status_reactions', filter }, (payload) => {
        const r = payload.new as Reaction
        if (r.user_id === user.id) return
        const meta = REACCIONES.find((x) => x.key === r.tipo)
        if (meta) push({ icon: meta.icon, title: `Tu pareja ${meta.msg}` })
      })
      .subscribe()

    supabase.from('statuses').select('emoji,mensaje').eq('space_id', space.id).neq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        lastMood.current = data?.emoji ?? null
        lastMsg.current = data?.mensaje ?? null
      })

    return () => { supabase.removeChannel(channel) }
  }, [space, user])

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-28 z-[60] flex flex-col items-center gap-2 md:inset-x-auto md:bottom-6 md:right-6 md:items-end">
      {toasts.map((t) => (
        <div key={t.id} className="animate-pop pointer-events-auto flex max-w-[360px] items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 shadow-[0_14px_36px_rgba(124,92,219,.28)]">
          {t.icon ? <Icon name={t.icon} size={42} /> : <MoodIcon value={t.mood} size={42} />}
          <div className="min-w-0">
            <p className="m-0 text-sm font-bold leading-tight text-ink">{t.title}</p>
            {t.text && <p className="m-0 truncate font-hand text-lg leading-tight text-ink-soft">{t.text}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
