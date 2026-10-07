import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import type { Movie } from '../../types/db'

const ESTADOS: Record<Movie['estado'], string> = {
  por_ver: 'Por ver',
  viendo: 'Viendo',
  vista: 'Vista',
}

export default function Movies() {
  const { space, user } = useAuth()
  const [movies, setMovies] = useState<Movie[]>([])
  const [titulo, setTitulo] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState<Movie | null>(null)
  const [spinning, setSpinning] = useState(false)

  async function load() {
    if (!space) return
    const { data } = await supabase
      .from('movies')
      .select('*')
      .eq('space_id', space.id)
      .order('creado_en', { ascending: false })
    setMovies((data as Movie[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim()) return
    await supabase.from('movies').insert({
      space_id: space.id,
      agregado_por: user.id,
      titulo,
    })
    setTitulo('')
    setOpen(false)
    load()
  }

  async function setEstado(id: string, estado: Movie['estado']) {
    await supabase.from('movies').update({ estado }).eq('id', id)
    load()
  }

  function spin() {
    const pending = movies.filter((m) => m.estado === 'por_ver')
    if (pending.length === 0) return
    setSpinning(true)
    setPicked(null)
    let count = 0
    const interval = setInterval(() => {
      setPicked(pending[Math.floor(Math.random() * pending.length)])
      count++
      if (count > 12) {
        clearInterval(interval)
        setSpinning(false)
      }
    }, 120)
  }

  const pendingCount = movies.filter((m) => m.estado === 'por_ver').length

  return (
    <div className="mx-auto max-w-[800px] p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Pelis y series</h1>
        <Button variant="primary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cancelar' : '+ Agregar'}
        </Button>
      </div>

      <div className="mt-6 rounded-[var(--radius-lg)] bg-grad-dream p-6 text-center">
        <p className="font-display text-xl font-semibold text-ink">¿Qué vemos hoy?</p>
        <div className="mt-3 flex justify-center">
          <LoopyMascot expression={spinning ? 'celebrating' : 'thinking'} />
        </div>
        {picked && (
          <p className="mt-3 font-display text-lg font-semibold text-ink">{picked.titulo}</p>
        )}
        <Button
          variant="primary-soft"
          className="mt-4"
          onClick={spin}
          disabled={pendingCount === 0 || spinning}
        >
          {pendingCount === 0 ? 'Agreguen algo para ver' : spinning ? 'Pensando…' : 'Girar la ruleta'}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-loopy-sm)]"
        >
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título de la peli o serie"
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <Button type="submit" variant="primary">
            Agregar
          </Button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {!loading && movies.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <LoopyMascot expression="thinking" />
            <p className="text-ink-soft">Todavía no hay nada en la lista. ¿Agregamos algo?</p>
          </div>
        )}
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-line bg-surface p-4"
          >
            <p className="font-semibold text-ink">{movie.titulo}</p>
            <select
              value={movie.estado}
              onChange={(e) => setEstado(movie.id, e.target.value as Movie['estado'])}
              className="rounded-[var(--radius-sm)] bg-surface-soft px-3 py-2 text-sm font-semibold text-ink-soft outline-none"
            >
              {Object.entries(ESTADOS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
