import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'

interface Notification {
  id: string; title: string; body: string | null; url: string
  read_at: string | null; created_at: string
}

export function NotificationMenu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [limit, setLimit] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setItems([]); setUnread(0); setError(null); setLoading(true)
    if (!user) { setLoading(false); return }
    let active = true
    let revision = 0
    async function load() {
      const current = ++revision
      const [list, count] = await Promise.all([
        supabase.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(limit),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).is('read_at', null),
      ])
      if (!active || current !== revision) return
      setLoading(false)
      if (list.error || count.error) { setError('No se pudo cargar tu historial de notificaciones. Probá nuevamente.'); return }
      setItems(list.data as Notification[]); setUnread(count.count ?? 0); setError(null)
    }
    void load()
    const channel = supabase.channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => { void load() }).subscribe()
    const timer = window.setInterval(() => { void load() }, 30000)
    const refresh = () => { void load() }
    window.addEventListener('focus', refresh)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); void supabase.removeChannel(channel) }
  }, [user?.id, limit])

  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus() } }
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])

  async function markRead(item?: Notification) {
    if (!user || saving) return false
    if (item?.read_at) return true
    setSaving(true)
    const now = new Date().toISOString()
    let query = supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null)
    if (item) query = query.eq('id', item.id)
    const { error: failure, data } = await query.select('id')
    setSaving(false)
    if (failure) { setError('No se pudo marcar como leída. Probá nuevamente.'); return false }
    const ids = new Set(data?.map((row) => row.id))
    setItems((previous) => previous.map((row) => ids.has(row.id) ? { ...row, read_at: now } : row))
    setUnread((previous) => Math.max(0, previous - ids.size)); setError(null)
    return true
  }

  return (
    <div ref={root} className="relative shrink-0">
      <button type="button" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`} aria-expanded={open} aria-controls="notification-panel" onClick={() => setOpen(!open)} className="relative rounded-full bg-white p-1 shadow-[var(--shadow-loopy-md)] transition-transform hover:scale-105">
        <Icon name="bell" size={40} />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-plum px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && <section id="notification-panel" aria-label="Notificaciones" className="absolute right-0 top-full mt-3 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-[28px] bg-cream shadow-[var(--shadow-fluffy-lg)] ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-4">
          <h2 className="m-0 text-lg text-ink">Notificaciones</h2>
          <button type="button" disabled={!unread || saving} onClick={() => { void markRead() }} className="text-xs font-bold text-plum disabled:opacity-40">Marcar todas leídas</button>
        </div>
        <div className="max-h-[min(480px,65vh)] overflow-y-auto">
          {error && <p role="alert" className="m-3 rounded-2xl bg-blush p-3 text-sm text-ink">{error}</p>}
          {loading && <p role="status" className="p-5 text-sm text-ink-soft">Cargando notificaciones…</p>}
          {!loading && !error && !items.length && <div className="px-6 py-8 text-center"><Icon name="bell" size={48} /><p className="mb-1 font-bold text-ink">Todavía no hay avisos</p><p className="m-0 text-sm text-ink-soft">Los toques, estados, reacciones, cartas y notitas de tu pareja quedarán guardados acá.</p></div>}
          {items.map((item) => <button key={item.id} type="button" disabled={saving} onClick={async () => { if (await markRead(item)) { setOpen(false); navigate(item.url.startsWith('/app') && !item.url.startsWith('//') ? item.url : '/app') } }} className={`flex w-full items-start gap-3 border-b border-line px-4 py-4 text-left transition-colors hover:bg-white ${item.read_at ? '' : 'bg-lilac-mist/60'}`}>
            <Icon name={item.url === '/app/cartas' ? 'cartas' : item.url === '/app/notitas' ? 'notitas' : 'bell'} size={36} />
            <div className="min-w-0 flex-1"><p className="m-0 text-sm font-bold text-ink">{item.title}</p>{item.body && <p className="mb-1 mt-1 break-words text-sm text-ink-soft">{item.body}</p>}<time dateTime={item.created_at} className="text-xs text-ink-muted">{new Date(item.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</time></div>
            {!item.read_at && <span aria-label="Sin leer" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-plum" />}
          </button>)}
          {items.length >= limit && <button type="button" onClick={() => setLimit(limit + 30)} className="w-full p-4 text-sm font-bold text-plum">Ver anteriores</button>}
        </div>
      </section>}
    </div>
  )
}
