import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { THREAD_COLORS, DEFAULT_THREAD_COLOR } from '../../lib/threadColors'
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
    <div ref={menuRef} className="fixed right-4 top-4 z-50 flex items-start gap-2 md:right-6 md:top-6">
      {showBubble && (
        <button
          onClick={() => navigate('/app/estados')}
          className="relative mt-1 max-w-[180px] rounded-[var(--radius-md)] bg-surface px-3 py-2 text-left shadow-[var(--shadow-loopy-md)] transition-transform hover:-translate-y-0.5 sm:max-w-[240px]"
        >
          <span className="flex items-center gap-1.5 text-sm text-ink">
            {mine?.emoji && <span>{mine.emoji}</span>}
            <span className="truncate">
              {bubbleText || DISPONIBILIDAD_LABEL[mine?.disponibilidad ?? ''] || 'Mi estado'}
            </span>
          </span>
          <span className="absolute -right-1.5 top-3 h-3 w-3 rotate-45 bg-surface" />
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-semibold text-ink shadow-[var(--shadow-loopy-md)] ring-2 ring-white transition-transform hover:scale-105"
          style={{ background: threadColor }}
          aria-label="Tu cuenta"
        >
          {initial}
        </button>

        {open && (
          <div className="absolute right-0 top-14 w-56 rounded-[var(--radius-lg)] bg-surface p-2 shadow-[var(--shadow-loopy-lg)]">
            <div className="px-3 py-2">
              <p className="font-semibold text-ink">{profile?.apodo || 'Vos'}</p>
              <p className="truncate text-xs text-ink-muted">{profile?.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <button
              onClick={() => {
                setOpen(false)
                navigate('/app/estados')
              }}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-semibold text-ink-soft hover:bg-surface-soft"
            >
              💭 Mi estado
            </button>
            <button
              onClick={() => {
                setOpen(false)
                navigate('/app/ajustes')
              }}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-semibold text-ink-soft hover:bg-surface-soft"
            >
              ⚙️ Ajustes
            </button>
            <div className="my-1 h-px bg-line" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-semibold text-error hover:bg-surface-soft"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
