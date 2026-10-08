import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { Page, PageHeader, EmptyState, IconBtn, Chip } from '../../components/ui/PageShell'
import type { Link as LinkRow } from '../../types/db'

const API_URL = import.meta.env.VITE_API_URL as string
const CATEGORIES: { key: string; icon: IconName }[] = [
  { key: 'lugares', icon: 'pin' }, { key: 'recetas', icon: 'pot' }, { key: 'compras', icon: 'bag' }, { key: 'memes', icon: 'smile' },
  { key: 'viajes', icon: 'plane' }, { key: 'videos', icon: 'video' }, { key: 'otro', icon: 'links' },
]
const catIcon = (c: string | null): IconName => CATEGORIES.find((x) => x.key === c)?.icon ?? 'links'
const domain = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }
type Tab = 'pendientes' | 'hechos' | 'favoritos'

function Edit({ link, onClose, onSave }: { link: LinkRow; onClose: () => void; onSave: (p: Partial<LinkRow>) => void }) {
  const [titulo, setTitulo] = useState(link.titulo ?? '')
  const [nota, setNota] = useState(link.nota ?? '')
  const [cat, setCat] = useState(link.categoria ?? 'otro')
  return (
    <Modal title="Editar link" onClose={onClose}>
      <p className="m-0 truncate text-sm text-ink-muted">{domain(link.url)}</p>
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="field" />
      <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} placeholder="Nota (ej: reservar con tiempo, ir en verano…)" className="field font-hand text-[22px]" />
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button type="button" key={c.key} onClick={() => setCat(c.key)} className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[13px] font-bold capitalize transition-all ${cat === c.key ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft'}`}><Icon name={c.icon} size={28} />{c.key}</button>
        ))}
      </div>
      <Button onClick={() => onSave({ titulo: titulo.trim() || null, nota: nota.trim() || null, categoria: cat })}>Guardar</Button>
    </Modal>
  )
}

export default function Links() {
  const { space, user } = useAuth()
  const [links, setLinks] = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [cat, setCat] = useState('lugares')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>('pendientes')
  const [filter, setFilter] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<LinkRow | null>(null)

  async function load() {
    if (!space) return
    const { data } = await supabase.from('links').select('*').eq('space_id', space.id).order('creado_en', { ascending: false })
    setLinks((data as LinkRow[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space])
  useEffect(() => {
    if (!space) return
    const ch = supabase.channel(`links-${space.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'links', filter: `space_id=eq.${space.id}` }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [space])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!space || !user || !url.trim()) return
    setSaving(true)
    let titulo: string | null = null, imagen: string | null = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const r = await fetch(`${API_URL}/api/link-preview?url=${encodeURIComponent(url)}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (r.ok) { const p = await r.json(); titulo = p.titulo; imagen = p.imagen }
      }
    } catch { /* preview opcional */ }
    await supabase.from('links').insert({ space_id: space.id, agregado_por: user.id, url: url.trim(), titulo, imagen, categoria: cat })
    setUrl(''); setSaving(false); load()
  }
  async function patch(id: string, p: Partial<LinkRow>) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...p } : l)))
    await supabase.from('links').update(p).eq('id', id)
  }
  async function remove(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id))
    await supabase.from('links').delete().eq('id', id)
  }

  const counts = useMemo(() => ({
    pendientes: links.filter((l) => !l.hecho).length,
    hechos: links.filter((l) => l.hecho).length,
    favoritos: links.filter((l) => l.favorito).length,
  }), [links])

  const shown = links.filter((l) => {
    if (tab === 'pendientes' && l.hecho) return false
    if (tab === 'hechos' && !l.hecho) return false
    if (tab === 'favoritos' && !l.favorito) return false
    if (filter && l.categoria !== filter) return false
    const t = q.trim().toLowerCase()
    return !t || (l.titulo ?? '').toLowerCase().includes(t) || l.url.toLowerCase().includes(t) || (l.nota ?? '').toLowerCase().includes(t)
  })
  const total = links.length
  const pct = total ? Math.round((counts.hechos / total) * 100) : 0

  return (
    <Page max={1500}>
      <PageHeader icon="links" title="Links" subtitle="Lugares, recetas y cosas para no perder." />

      <form onSubmit={add} className="card mb-6 flex flex-wrap items-center gap-3 !p-3 md:!p-4">
        <Icon name="links" size={44} className="hidden sm:inline-flex" />
        <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Pegá un link y listo…" className="field min-w-[220px] flex-1 !bg-surface-soft" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="field !h-12 !w-auto capitalize" aria-label="Categoría">
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
        </select>
        <Button type="submit" disabled={saving}><Icon name="plus" bare size={20} tone="lavender" />{saving ? 'Guardando…' : 'Guardar'}</Button>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-white/80 p-1.5 shadow-[var(--shadow-loopy-sm)]">
          {(['pendientes', 'hechos', 'favoritos'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm font-bold capitalize transition-all ${tab === t ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'text-ink-soft'}`}>{t} · {counts[t]}</button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="field !h-11 max-w-[240px]" />
        {total > 0 && <span className="ml-auto text-sm font-bold text-ink-soft">{pct}% hecho · {counts.hechos}/{total}</span>}
      </div>

      {links.length > 0 && (
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={filter === null} onClick={() => setFilter(null)}>Todos</Chip>
          {CATEGORIES.filter((c) => links.some((l) => l.categoria === c.key)).map((c) => (
            <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(filter === c.key ? null : c.key)}><Icon name={c.icon} bare size={14} /><span className="capitalize">{c.key}</span></Chip>
          ))}
        </div>
      )}

      {!loading && shown.length === 0 ? (
        <div className="grid"><EmptyState text={links.length ? 'No hay links en esta vista.' : 'Todavía no hay links guardados. Pegá el primero arriba.'} /></div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3 2xl:columns-4">
          {shown.map((l) => (
            <article key={l.id} className={`card card-lift mb-5 break-inside-avoid overflow-hidden !p-0 ${l.hecho ? 'opacity-70' : ''}`}>
              {l.imagen ? <img src={l.imagen} alt="" className="h-40 w-full object-cover" loading="lazy" /> : (
                <div className="grid h-24 place-items-center bg-grad-dream"><Icon name={catIcon(l.categoria)} size={56} /></div>
              )}
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-ink-muted"><Icon name={catIcon(l.categoria)} bare size={14} /><span className="truncate capitalize">{l.categoria}</span> · <span className="truncate">{domain(l.url)}</span></span>
                  <button onClick={() => patch(l.id, { favorito: !l.favorito })} aria-label="Favorito" className="shrink-0 transition-transform hover:scale-125 active:scale-90" style={{ opacity: l.favorito ? 1 : 0.3 }}><Icon name="star" bare size={22} /></button>
                </div>
                <a href={l.url} target="_blank" rel="noreferrer" className="line-clamp-3 font-bold leading-snug text-ink no-underline hover:text-plum">{l.titulo || l.url}</a>
                {l.nota && <p className="m-0 rounded-[18px] bg-[#FFF8E1] px-4 py-2 font-hand text-[21px] leading-tight text-ink">{l.nota}</p>}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button onClick={() => patch(l.id, { hecho: !l.hecho })} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-all ${l.hecho ? 'bg-[#D5F3E6] text-success' : 'bg-lilac-mist text-plum'}`}>
                    <Icon name="check" bare size={16} tone={l.hecho ? 'mint' : 'lavender'} />{l.hecho ? 'Hecho' : 'Marcar hecho'}
                  </button>
                  <div className="flex gap-2">
                    <IconBtn icon="edit" label="Editar" onClick={() => setEditing(l)} />
                    <IconBtn icon="trash" label="Eliminar" danger onClick={() => remove(l.id)} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <Edit link={editing} onClose={() => setEditing(null)} onSave={(p) => { patch(editing.id, p); setEditing(null) }} />}
    </Page>
  )
}
