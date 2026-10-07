import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Icon } from '../../components/ui/Icon'
import { Page, PageHeader, EmptyState, IconBtn, FormCard } from '../../components/ui/PageShell'
import type { Movie } from '../../types/db'

const ESTADOS: Record<Movie['estado'], string> = { por_ver: 'Por ver', viendo: 'Viendo', vista: 'Vista' }

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
    const { data } = await supabase.from('movies').select('*').eq('space_id', space.id).order('creado_en', { ascending: false })
    setMovies((data as Movie[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim()) return
    await supabase.from('movies').insert({ space_id: space.id, agregado_por: user.id, titulo })
    setTitulo(''); setOpen(false); load()
  }
  async function setEstado(id: string, estado: Movie['estado']) { await supabase.from('movies').update({ estado }).eq('id', id); load() }
  async function handleDelete(id: string) { await supabase.from('movies').delete().eq('id', id); load() }

  function spin() {
    const pending = movies.filter((m) => m.estado === 'por_ver')
    if (pending.length === 0) return
    setSpinning(true)
    setPicked(null)
    let count = 0
    const interval = setInterval(() => {
      setPicked(pending[Math.floor(Math.random() * pending.length)])
      count++
      if (count > 12) { clearInterval(interval); setSpinning(false) }
    }, 120)
  }

  const pendingCount = movies.filter((m) => m.estado === 'por_ver').length

  return (
    <Page>
      <PageHeader
        icon="pelis" title="Pelis y series" subtitle="Su lista para ver juntos."
        action={
          <Button variant={open ? 'secondary' : 'primary'} onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'close' : 'plus'} bare size={20} tone="lavender" />
            {open ? 'Cancelar' : 'Agregar'}
          </Button>
        }
      />

      <div className="card relative mb-6 overflow-hidden bg-grad-dream text-center">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
        <p className="relative m-0 font-display text-2xl font-semibold text-ink">¿Qué vemos hoy?</p>
        <div className="relative my-2 flex justify-center">
          <LoopyMascot size={110} expression={spinning ? 'celebrating' : 'thinking'} />
        </div>
        <p className="relative m-0 min-h-[32px] font-display text-xl font-semibold text-plum">{picked?.titulo ?? ''}</p>
        <Button variant="primary-soft" className="relative mt-3" onClick={spin} disabled={pendingCount === 0 || spinning}>
          <Icon name="dice" bare size={20} />
          {pendingCount === 0 ? 'Agreguen algo para ver' : spinning ? 'Pensando…' : 'Girar la ruleta'}
        </Button>
      </div>

      {open && (
        <FormCard onSubmit={handleSubmit}>
          <input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la peli o serie" className="field" />
          <Button type="submit">Agregar</Button>
        </FormCard>
      )}

      <div className="flex flex-col gap-3">
        {!loading && movies.length === 0 && <EmptyState text="Todavía no hay nada en la lista. ¿Agregamos algo?" />}
        {movies.map((movie) => (
          <div key={movie.id} className="card card-lift flex flex-col gap-3 !p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Icon name={movie.estado === 'vista' ? 'check' : movie.estado === 'viendo' ? 'play' : 'popcorn'} size={46} tone={movie.estado === 'vista' ? 'mint' : movie.estado === 'viendo' ? 'lavender' : 'butter'} />
              <p className={`m-0 truncate font-bold ${movie.estado === 'vista' ? 'text-ink-muted' : 'text-ink'}`}>{movie.titulo}</p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-full bg-surface-soft p-1">
                {(Object.keys(ESTADOS) as Movie['estado'][]).map((k) => (
                  <button
                    key={k} onClick={() => setEstado(movie.id, k)}
                    className={`rounded-full px-3 py-1.5 text-[13px] font-bold transition-all ${movie.estado === k ? 'bg-white text-plum shadow-[var(--shadow-loopy-sm)]' : 'text-ink-muted'}`}
                  >
                    {ESTADOS[k]}
                  </button>
                ))}
              </div>
              <IconBtn icon="trash" label="Eliminar" danger onClick={() => handleDelete(movie.id)} />
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}
