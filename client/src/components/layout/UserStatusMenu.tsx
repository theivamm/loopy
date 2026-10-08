import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { THREAD_COLORS, DEFAULT_THREAD_COLOR } from '../../lib/threadColors'
import { Icon, MoodIcon } from '../ui/Icon'
import type { Status } from '../../types/db'

const DISPONIBILIDAD_LABEL: Record<string, string> = {
  libre: 'Libre',
  ocupado: 'Ocupado',
  no_molestar: 'No molestar',
}

export function UserStatusMenu() {
  const { user, profile, space } = useAuth()
  const navigate = useNavigate()
  const [mine, setMine] = useState<Status | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!space || !user) return

    function load() {
      if (!space || !user) return
      supabase
        .from('statuses')
        .select('*')
        .eq('space_id', space.id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setMine(data as Status | null))
    }

    load()

    const channel = supabase
      .channel(`my-status-${space.id}-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'statuses', filter: `space_id=eq.${space.id}` },
        load,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [space, user])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const threadColor = THREAD_COLORS[profile?.color_hilo ?? ''] ?? DEFAULT_THREAD_COLOR
  const initial = (profile?.apodo || profile?.email || '?').charAt(0).toUpperCase()
  const bubbleText = mine?.mensaje || mine?.actividad
  const showBubble = Boolean(mine && (bubbleText || mine.emoji))

  return (
    <div ref={menuRef} className="relative z-50 flex items-center gap-2">
      {showBubble && (
        <button
          onClick={() => navigate('/app/estados')}
          className="glass flex max-w-[150px] items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-left shadow-[var(--shadow-loopy-md)] transition-transform hover:-translate-y-0.5 sm:max-w-[260px]"
        >
          <MoodIcon value={mine?.emoji} size={32} />
          <span className="truncate text-[13px] font-semibold text-ink">
            {bubbleText || DISPONIBILIDAD_LABEL[mine?.disponibilidad ?? ''] || 'Mi estado'}
          </span>
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-semibold text-ink shadow-[var(--shadow-loopy-md)] ring-[3px] ring-white transition-transform hover:scale-105 active:scale-95"
          style={{ background: threadColor }}
          aria-label="Tu cuenta"
        >
          {initial}
        </button>

        {open && (
          <div className="animate-pop absolute right-0 top-14 w-64 rounded-[28px] bg-white p-2 shadow-[var(--shadow-loopy-lg)]">
            <div className="px-3 py-2">
              <p className="m-0 font-bold text-ink">{profile?.apodo || 'Vos'}</p>
              <p className="m-0 truncate text-xs text-ink-muted">{profile?.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <button
              onClick={() => { setOpen(false); navigate('/app/estados') }}
              className="flex w-full items-center gap-3 rounded-full p-1.5 text-left text-sm font-bold text-ink-soft hover:bg-surface-soft"
            >
              <Icon name="estados" size={34} /> Mi estado
            </button>
            <button
              onClick={() => { setOpen(false); navigate('/app/ajustes') }}
              className="flex w-full items-center gap-3 rounded-full p-1.5 text-left text-sm font-bold text-ink-soft hover:bg-surface-soft"
            >
              <Icon name="ajustes" size={34} /> Ajustes
            </button>
            <div className="my-1 h-px bg-line" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-full p-1.5 text-left text-sm font-bold text-error hover:bg-surface-soft"
            >
              <Icon name="logout" size={34} /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
