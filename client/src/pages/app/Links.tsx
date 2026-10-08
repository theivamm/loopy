import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Page, PageHeader, EmptyState, IconBtn, FormCard, Chip } from '../../components/ui/PageShell'
import type { Link as LinkRow } from '../../types/db'

const API_URL = import.meta.env.VITE_API_URL as string

const CATEGORIES: { key: string; icon: IconName }[] = [
  { key: 'lugares', icon: 'pin' },
  { key: 'recetas', icon: 'pot' },
  { key: 'compras', icon: 'bag' },
  { key: 'memes', icon: 'smile' },
  { key: 'viajes', icon: 'plane' },
  { key: 'videos', icon: 'video' },
  { key: 'otro', icon: 'links' },
]
const catIcon = (c: string | null): IconName => CATEGORIES.find((x) => x.key === c)?.icon ?? 'links'

export default function Links() {
  const { space, user } = useAuth()
  const [links, setLinks] = useState<LinkRow[]>([])
  const [url, setUrl] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIES[0].key)
  const [filter, setFilter] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!space) return
    const { data } = await supabase.from('links').select('*').eq('space_id', space.id).order('creado_en', { ascending: false })
    setLinks((data as LinkRow[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !url.trim()) return
    setSaving(true)
    let titulo: string | null = null
    let imagen: string | null = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const res = await fetch(`${API_URL}/api/link-preview?url=${encodeURIComponent(url)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const preview = await res.json()
          titulo = preview.titulo
          imagen = preview.imagen
        }
      }
    } catch {
      // preview is best-effort
    }
    await supabase.from('links').insert({ space_id: space.id, agregado_por: user.id, url, titulo, imagen, categoria })
    setUrl(''); setOpen(false); setSaving(false); load()
  }
  async function toggleHecho(id: string, hecho: boolean) { await supabase.from('links').update({ hecho: !hecho }).eq('id', id); load() }
  async function handleDelete(id: string) { await supabase.from('links').delete().eq('id', id); load() }

  const shown = filter ? links.filter((l) => l.categoria === filter) : links

  return (
    <Page>
      <PageHeader
        icon="links" title="Links" subtitle="Lugares, recetas y cosas para no perder."
        action={
          <Button variant={open ? 'secondary' : 'primary'} onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'close' : 'plus'} bare size={20} tone="lavender" />
            {open ? 'Cancelar' : 'Agregar'}
          </Button>
        }
      />

      {open && (
        <FormCard onSubmit={handleSubmit}>
          <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="field" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button" key={c.key} onClick={() => setCategoria(c.key)}
                className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold capitalize transition-all ${
                  categoria === c.key ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft'
                }`}
              >
                <Icon name={c.icon} size={30} />{c.key}
              </button>
            ))}
          </div>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar link'}</Button>
        </FormCard>
      )}

      {links.length > 0 && (
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={filter === null} onClick={() => setFilter(null)}>Todos</Chip>
          {CATEGORIES.filter((c) => links.some((l) => l.categoria === c.key)).map((c) => (
            <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(filter === c.key ? null : c.key)}>
              <span className="capitalize">{c.key}</span>
            </Chip>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 md:gap-5">
        {!loading && shown.length === 0 && <EmptyState text="Todavía no hay links guardados." />}
        {shown.map((link) => (
          <div key={link.id} className={`card card-lift flex flex-col overflow-hidden !p-0 ${link.hecho ? 'opacity-60' : ''}`}>
            {link.imagen ? (
              <img src={link.imagen} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="grid h-24 place-items-center bg-grad-dream">
                <Icon name={catIcon(link.categoria)} size={56} />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="eyebrow m-0 !text-[11px] text-ink-muted">{link.categoria}</p>
              <a href={link.url} target="_blank" rel="noreferrer" className="line-clamp-2 font-bold text-ink no-underline hover:text-plum">
                {link.titulo || link.url}
              </a>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => toggleHecho(link.id, link.hecho)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-all ${
                    link.hecho ? 'bg-[#D5F3E6] text-success' : 'bg-lilac-mist text-plum'
                  }`}
                >
                  <Icon name="check" bare size={16} tone={link.hecho ? 'mint' : 'lavender'} />
                  {link.hecho ? 'Hecho' : 'Marcar hecho'}
                </button>
                <IconBtn icon="trash" label="Eliminar link" danger onClick={() => handleDelete(link.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}
