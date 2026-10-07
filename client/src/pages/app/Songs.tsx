import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import type { Song } from '../../types/db'

export default function Songs() {
  const { space, user } = useAuth()
  const [songs, setSongs] = useState<Song[]>([])
  const [titulo, setTitulo] = useState('')
  const [artista, setArtista] = useState('')
  const [url, setUrl] = useState('')
  const [nota, setNota] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space) return
    const { data } = await supabase
      .from('songs')
      .select('*')
      .eq('space_id', space.id)
      .order('fecha', { ascending: false })
    setSongs((data as Song[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim()) return
    await supabase.from('songs').insert({
      space_id: space.id,
      agregado_por: user.id,
      titulo,
      artista: artista || null,
      url: url || null,
      nota: nota || null,
    })
    setTitulo('')
    setArtista('')
    setUrl('')
    setNota('')
    setOpen(false)
    load()
  }

  async function markAsToday(id: string) {
    if (!space) return
    await supabase.from('songs').update({ es_del_dia: false }).eq('space_id', space.id)
    await supabase.from('songs').update({ es_del_dia: true }).eq('id', id)
    load()
  }

  const songOfTheDay = songs.find((s) => s.es_del_dia)

  return (
    <div className="mx-auto max-w-[800px] p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Música</h1>
        <Button variant="primary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cancelar' : '+ Agregar'}
        </Button>
      </div>

      {songOfTheDay && (
        <div className="mt-6 rounded-[var(--radius-lg)] bg-grad-loop p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/70">
            🎵 Canción del día
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">{songOfTheDay.titulo}</p>
          {songOfTheDay.artista && <p className="text-ink/80">{songOfTheDay.artista}</p>}
          {songOfTheDay.nota && <p className="mt-2 font-hand text-lg text-ink">{songOfTheDay.nota}</p>}
          {songOfTheDay.url && (
            <a
              href={songOfTheDay.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-ink underline"
            >
              Escuchar →
            </a>
          )}
        </div>
      )}

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-loopy-sm)]"
        >
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título de la canción"
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <input
            value={artista}
            onChange={(e) => setArtista(e.target.value)}
            placeholder="Artista (opcional)"
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link de Spotify / YouTube / Apple Music"
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota (opcional)"
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 font-hand text-lg outline-none focus:ring-2 focus:ring-lavender"
          />
          <Button type="submit" variant="primary">
            Agregar canción
          </Button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {!loading && songs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <LoopyMascot expression="thinking" />
            <p className="text-ink-soft">Todavía no hay canciones. ¿Agregamos la primera?</p>
          </div>
        )}
        {songs.map((song) => (
          <div
            key={song.id}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-line bg-surface p-4"
          >
            <div>
              <p className="font-semibold text-ink">{song.titulo}</p>
              {song.artista && <p className="text-sm text-ink-soft">{song.artista}</p>}
            </div>
            {!song.es_del_dia && (
              <Button variant="secondary" onClick={() => markAsToday(song.id)}>
                Hacer canción del día
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
