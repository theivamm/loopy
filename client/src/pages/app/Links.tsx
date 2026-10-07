import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import type { Link as LinkRow } from '../../types/db'

const API_URL = import.meta.env.VITE_API_URL as string

const CATEGORIES = ['lugares', 'recetas', 'compras', 'memes', 'viajes', 'videos', 'otro']

export default function Links() {
  const { space, user } = useAuth()
  const [links, setLinks] = useState<LinkRow[]>([])
  const [url, setUrl] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIES[0])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!space) return
    const { data } = await supabase
      .from('links')
      .select('*')
      .eq('space_id', space.id)
      .order('creado_en', { ascending: false })
    setLinks((data as LinkRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !url.trim()) return
    setSaving(true)

    let titulo: string | null = null
    let imagen: string | null = null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
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
      // preview is best-effort; the link still gets saved without it
    }

    await supabase.from('links').insert({
      space_id: space.id,
      agregado_por: user.id,
      url,
      titulo,
      imagen,
      categoria,
    })
    setUrl('')
    setOpen(false)
    setSaving(false)
    load()
  }

  async function toggleHecho(id: string, hecho: boolean) {
    await supabase.from('links').update({ hecho: !hecho }).eq('id', id)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('links').delete().eq('id', id)
    load()
  }

  return (
    <div className="mx-auto max-w-[800px] p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Links</h1>
        <Button variant="primary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cancelar' : '+ Agregar'}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-loopy-sm)]"
        >
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 capitalize outline-none focus:ring-2 focus:ring-lavender"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar link'}
          </Button>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!loading && links.length === 0 && (
          <div className="col-span-2 flex flex-col items-center gap-3 py-12 text-center">
            <LoopyMascot expression="thinking" />
            <p className="text-ink-soft">Todavía no hay links guardados.</p>
          </div>
        )}
        {links.map((link) => (
          <div
            key={link.id}
            className={`flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-loopy-sm)] ${
              link.hecho ? 'opacity-60' : ''
            }`}
          >
            {link.imagen && (
              <img src={link.imagen} alt="" className="h-32 w-full object-cover" />
            )}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {link.categoria}
              </p>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="line-clamp-2 font-semibold text-ink hover:underline"
              >
                {link.titulo || link.url}
              </a>
              <div className="mt-auto flex items-center justify-between">
                <button
                  onClick={() => toggleHecho(link.id, link.hecho)}
                  className="text-sm font-semibold text-plum"
                >
                  {link.hecho ? '✓ Hecho' : 'Marcar como hecho'}
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="text-sm font-semibold text-error"
                  aria-label="Eliminar link"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
