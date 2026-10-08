import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Page, PageHeader, EmptyState, IconBtn, FormCard } from '../../components/ui/PageShell'
import type { Song } from '../../types/db'

const API_URL = import.meta.env.VITE_API_URL as string

export default function Songs() {
  const { space, user } = useAuth()
  const [songs, setSongs] = useState<Song[]>([])
  const [titulo, setTitulo] = useState('')
  const [artista, setArtista] = useState('')
  const [url, setUrl] = useState('')
  const [nota, setNota] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!space) return
    const { data } = await supabase.from('songs').select('*').eq('space_id', space.id).order('fecha', { ascending: false })
    setSongs((data as Song[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim()) return
    setSaving(true)

    let imagen: string | null = null
    let plataforma: string | null = null
    let autoTitulo: string | null = null
    let autoArtista: string | null = null

    if (url.trim()) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const res = await fetch(`${API_URL}/api/song-preview?url=${encodeURIComponent(url)}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            const preview = await res.json()
            imagen = preview.imagen
            plataforma = preview.plataforma
            autoTitulo = preview.titulo
            autoArtista = preview.artista
          }
        }
      } catch {
        // preview is best-effort
      }
    }

    await supabase.from('songs').insert({
      space_id: space.id, agregado_por: user.id,
      titulo: titulo.trim() || autoTitulo || 'Sin título',
      artista: artista || autoArtista || null,
      url: url || null, nota: nota || null, imagen, plataforma,
    })
    setTitulo(''); setArtista(''); setUrl(''); setNota(''); setOpen(false); setSaving(false); load()
  }

  async function markAsToday(id: string) {
    if (!space) return
    await supabase.from('songs').update({ es_del_dia: false }).eq('space_id', space.id)
    await supabase.from('songs').update({ es_del_dia: true }).eq('id', id)
    load()
  }
  async function handleDelete(id: string) { await supabase.from('songs').delete().eq('id', id); load() }

  const songOfTheDay = songs.find((s) => s.es_del_dia)

  return (
    <Page>
      <PageHeader
        icon="musica" title="Música" subtitle="La playlist que arman juntos."
        action={
          <Button variant={open ? 'secondary' : 'primary'} onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'close' : 'plus'} bare size={20} tone="lavender" />
            {open ? 'Cancelar' : 'Agregar'}
          </Button>
        }
      />

      {songOfTheDay && (
        <div className="card relative mb-6 flex items-center gap-4 overflow-hidden bg-grad-loop">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
          {songOfTheDay.imagen ? (
            <img src={songOfTheDay.imagen} alt="" className="relative h-24 w-24 shrink-0 rounded-[28px] object-cover shadow-[var(--shadow-loopy-md)]" />
          ) : (
            <Icon name="musica" size={88} className="relative" />
          )}
          <div className="relative min-w-0">
            <p className="eyebrow m-0">Canción del día</p>
            <p className="m-0 mt-1 truncate font-display text-2xl font-semibold text-ink">{songOfTheDay.titulo}</p>
            {songOfTheDay.artista && <p className="m-0 truncate text-ink/80">{songOfTheDay.artista}</p>}
            {songOfTheDay.nota && <p className="m-0 mt-1 font-hand text-xl leading-tight text-ink">“{songOfTheDay.nota}”</p>}
            {songOfTheDay.url && (
              <a href={songOfTheDay.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-plum no-underline hover:bg-white">
                <Icon name="play" bare size={16} /> Escuchar
              </a>
            )}
          </div>
        </div>
      )}

      {open && (
        <FormCard onSubmit={handleSubmit}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link de Spotify / YouTube / Apple Music" className="field" />
          <input required={!url.trim()} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la canción" className="field" />
          <input value={artista} onChange={(e) => setArtista(e.target.value)} placeholder="Artista (opcional)" className="field" />
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" className="field font-hand text-xl" />
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Agregar canción'}</Button>
        </FormCard>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        {!loading && songs.length === 0 && <EmptyState text="Todavía no hay canciones. ¿Agregamos la primera?" />}
        {songs.map((song) => (
          <div key={song.id} className="card card-lift flex items-center gap-3 !p-3 md:!p-4">
            {song.imagen ? (
              <img src={song.imagen} alt="" className="h-14 w-14 shrink-0 rounded-[20px] object-cover" />
            ) : (
              <Icon name="musica" size={56} />
            )}
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate font-bold text-ink">{song.titulo}</p>
              {song.artista && <p className="m-0 truncate text-sm text-ink-soft">{song.artista}</p>}
            </div>
            {song.es_del_dia ? (
              <span className="hidden items-center gap-1.5 rounded-full bg-[#FFF0BF] px-3 py-1.5 text-xs font-bold sm:inline-flex"><Icon name="star" bare size={14} /> Del día</span>
            ) : (
              <IconBtn icon="star" label="Marcar como canción del día" onClick={() => markAsToday(song.id)} />
            )}
            <IconBtn icon="trash" label="Eliminar canción" danger onClick={() => handleDelete(song.id)} />
          </div>
        ))}
      </div>
    </Page>
  )
}
