import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Page, PageHeader, Chip } from '../../components/ui/PageShell'
import type { Movie } from '../../types/db'

const API_URL = import.meta.env.VITE_API_URL as string
type Estado = Movie['estado']
const TABS: { key: Estado; label: string }[] = [
  { key: 'por_ver', label: 'Por ver' },
  { key: 'viendo', label: 'Viendo' },
  { key: 'vista', label: 'Vistas' },
]
const PLATAFORMAS = ['Netflix', 'Max', 'Disney+', 'Prime', 'Apple TV+', 'Otra']
interface Found { tmdb_id: number; titulo: string; poster: string | null; anio: number | null; tipo: 'peli' | 'serie'; sinopsis: string | null }

const avg = (m: Movie) => {
  const v = Object.values(m.ratings ?? {})
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

function Stars({ value, onChange, size = 26 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n === value ? 0 : n)} aria-label={`${n} estrellas`}
          className={`transition-transform ${onChange ? 'hover:scale-125 active:scale-90' : 'cursor-default'}`} style={{ opacity: n <= value ? 1 : 0.25 }}>
          <Icon name="star" bare size={size} />
        </button>
      ))}
    </div>
  )
}

function Poster({ m, className = '' }: { m: Pick<Movie, 'poster' | 'titulo'>; className?: string }) {
  return m.poster ? (
    <img src={m.poster} alt={m.titulo} className={`aspect-[2/3] w-full rounded-[22px] object-cover ${className}`} loading="lazy" />
  ) : (
    <div className={`grid aspect-[2/3] w-full place-items-center rounded-[22px] p-3 text-center ${className}`} style={{ background: 'repeating-linear-gradient(135deg,#EAF4FF 0 10px,#DCEBFF 10px 20px)' }}>
      <div><Icon name="pelis" size={44} className="mx-auto" /><p className="m-0 mt-2 font-display text-sm font-semibold text-ink">{m.titulo}</p></div>
    </div>
  )
}

/* ───── Agregar ───── */
function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { space, user } = useAuth()
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Found[]>([])
  const [noKey, setNoKey] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)
    if (q.trim().length < 2) { setRes([]); return }
    timer.current = setTimeout(async () => {
      setBusy(true)
      setNoKey(false)
      setSearchError(false)
      const { data: { session } } = await supabase.auth.getSession()
      try {
        const r = await fetch(`${API_URL}/api/movies/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
        if (r.status === 503) setNoKey(true)
        else if (r.ok) setRes(await r.json())
        else setSearchError(true)
      } catch { setSearchError(true) }
      setBusy(false)
    }, 350)
  }, [q])

  async function add(f: Partial<Found> & { titulo: string }) {
    if (!space || !user) return
    await supabase.from('movies').insert({
      space_id: space.id, agregado_por: user.id, titulo: f.titulo, poster: f.poster ?? null, tmdb_id: f.tmdb_id ?? null,
      tipo: f.tipo ?? 'peli', anio: f.anio ?? null, sinopsis: f.sinopsis ?? null,
    })
    onAdded()
  }

  return (
    <Modal title="Agregar a la lista" onClose={onClose} max={720}>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscá una peli o serie…" className="field" />
      {noKey && <p className="m-0 rounded-[22px] bg-[#FFF3D6] px-5 py-3 text-sm font-semibold text-ink">Sin buscador (falta TMDB_API_KEY en el servidor). Podés agregarla con el título.</p>}
      {searchError && <p className="m-0 rounded-[22px] bg-[#FFE6EA] px-5 py-3 text-sm font-semibold text-error">No pudimos conectar con el buscador. Revisá que el servidor esté corriendo, o agregala con el título.</p>}
      {busy && <p className="m-0 text-center text-sm text-ink-muted">Buscando…</p>}
      {res.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {res.map((f) => (
            <button key={f.tmdb_id} onClick={() => add(f)} className="text-left transition-transform hover:scale-105 active:scale-95">
              <Poster m={f} />
              <p className="m-0 mt-1.5 line-clamp-2 text-xs font-bold text-ink">{f.titulo}</p>
              <p className="m-0 text-[11px] text-ink-muted">{f.anio ?? ''} · {f.tipo === 'serie' ? 'Serie' : 'Peli'}</p>
            </button>
          ))}
        </div>
      )}
      {q.trim().length >= 2 && (
        <Button variant="secondary" onClick={() => add({ titulo: q.trim() })}><Icon name="plus" bare size={18} />Agregar “{q.trim()}” a mano</Button>
      )}
    </Modal>
  )
}

/* ───── Detalle ───── */
function Detail({ movie, onClose, onChange, onDelete }: { movie: Movie; onClose: () => void; onChange: (p: Partial<Movie>) => void; onDelete: () => void }) {
  const { user } = useAuth()
  const mine = movie.ratings?.[user?.id ?? ''] ?? 0
  const theirsEntry = Object.entries(movie.ratings ?? {}).find(([id]) => id !== user?.id)
  const theirs = theirsEntry?.[1] ?? 0
  const match = mine && theirs ? (Math.abs(mine - theirs) <= 1 ? 'Coinciden' : 'Opiniones distintas') : null
  return (
    <Modal title={movie.titulo} onClose={onClose} max={680}>
      <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
        <Poster m={movie} />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Chip tone="sky">{movie.tipo === 'serie' ? 'Serie' : 'Película'}</Chip>
            {movie.anio && <Chip tone="lavender">{movie.anio}</Chip>}
          </div>
          {movie.sinopsis && <p className="m-0 line-clamp-5 text-sm leading-relaxed text-ink-soft">{movie.sinopsis}</p>}
          <div className="flex rounded-full bg-surface-soft p-1">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => onChange({ estado: t.key, vista_fecha: t.key === 'vista' ? new Date().toISOString().slice(0, 10) : null })}
                className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-all ${movie.estado === t.key ? 'bg-white text-plum shadow-[var(--shadow-loopy-sm)]' : 'text-ink-muted'}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[26px] bg-lilac-mist p-4"><p className="eyebrow m-0 mb-2 !text-plum">Tu puntaje</p><Stars value={mine} onChange={(n) => onChange({ ratings: { ...movie.ratings, [user!.id]: n } })} /></div>
        <div className="rounded-[26px] bg-[#FFE9DF] p-4"><p className="eyebrow m-0 mb-2 !text-[#F2733F]">Tu pareja</p>{theirs ? <Stars value={theirs} /> : <p className="m-0 text-sm text-ink-soft">Todavía no puntuó.</p>}</div>
      </div>
      {match && <p className="m-0 text-center text-sm font-bold text-ink-soft">{match === 'Coinciden' ? 'Coinciden en esta' : match}</p>}

      <div>
        <p className="eyebrow m-0 mb-2">Dónde verla</p>
        <div className="flex flex-wrap gap-2">
          {PLATAFORMAS.map((p) => (
            <button key={p} onClick={() => onChange({ plataforma: movie.plataforma === p ? null : p })} className={`rounded-full px-4 py-2 text-[13px] font-bold transition-all ${movie.plataforma === p ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'}`}>{p}</button>
          ))}
        </div>
      </div>
      <Button variant="danger" className="self-start" onClick={onDelete}><Icon name="trash" bare size={18} />Sacar de la lista</Button>
    </Modal>
  )
}

/* ───── Página ───── */
export default function Movies() {
  const { space } = useAuth()
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Estado>('por_ver')
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [kind, setKind] = useState<'todas' | 'peli' | 'serie'>('todas')
  const [picked, setPicked] = useState<Movie | null>(null)
  const [spinning, setSpinning] = useState(false)

  async function load() {
    if (!space) return
    const { data } = await supabase.from('movies').select('*').eq('space_id', space.id).order('creado_en', { ascending: false })
    setMovies(((data as Movie[]) ?? []).map((m) => ({ ...m, ratings: m.ratings ?? {} })))
    setLoading(false)
  }
  useEffect(() => { load() }, [space])
  useEffect(() => {
    if (!space) return
    const ch = supabase.channel(`movies-${space.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'movies', filter: `space_id=eq.${space.id}` }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [space])

  async function patch(id: string, p: Partial<Movie>) {
    setMovies((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)))
    await supabase.from('movies').update(p).eq('id', id)
  }
  async function remove(id: string) {
    setOpenId(null)
    await supabase.from('movies').delete().eq('id', id)
    load()
  }

  const pool = movies.filter((m) => m.estado === 'por_ver' && (kind === 'todas' || m.tipo === kind))
  function spin() {
    if (!pool.length) return
    setSpinning(true); setPicked(null)
    let n = 0
    const iv = setInterval(() => {
      setPicked(pool[Math.floor(Math.random() * pool.length)])
      if (++n > 14) { clearInterval(iv); setSpinning(false) }
    }, 110)
  }

  const shown = movies.filter((m) => m.estado === tab)
  const open = movies.find((m) => m.id === openId) ?? null

  return (
    <Page max={1500}>
      <PageHeader icon="pelis" title="Pelis y series" subtitle="Su lista para ver juntos." action={<Button onClick={() => setAdding(true)}><Icon name="plus" bare size={20} tone="lavender" />Agregar</Button>} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="mb-6 flex rounded-full bg-white/80 p-1.5 shadow-[var(--shadow-loopy-sm)] sm:inline-flex">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 rounded-full px-6 py-2.5 text-sm font-bold transition-all sm:flex-none ${tab === t.key ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'text-ink-soft'}`}>
                {t.label} · {movies.filter((m) => m.estado === t.key).length}
              </button>
            ))}
          </div>

          {!loading && shown.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 bg-white/70 py-14 text-center">
              <LoopyMascot size={110} expression="thinking" />
              <p className="m-0 max-w-xs text-ink-soft">{tab === 'por_ver' ? 'No hay nada en la lista. ¿Qué tienen ganas de ver?' : tab === 'viendo' ? 'No están viendo nada ahora.' : 'Todavía no vieron nada juntos.'}</p>
              <Button onClick={() => setAdding(true)}>Agregar</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {shown.map((m) => {
                const a = avg(m)
                return (
                  <button key={m.id} onClick={() => setOpenId(m.id)} className="group text-left" aria-label={m.titulo}>
                    <div className="relative transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                      <Poster m={m} className="shadow-[0_14px_28px_rgba(124,92,219,.22)]" />
                      {m.tipo === 'serie' && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#3B84D9]">Serie</span>}
                      {a !== null && <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 py-1 pl-1.5 pr-2.5 text-xs font-extrabold text-ink"><Icon name="star" bare size={14} />{a.toFixed(1)}</span>}
                    </div>
                    <p className="m-0 mt-2.5 line-clamp-1 text-sm font-bold text-ink">{m.titulo}</p>
                    <p className="m-0 text-xs text-ink-muted">{[m.anio, m.plataforma].filter(Boolean).join(' · ')}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Ruleta */}
        <aside className="xl:sticky xl:top-[92px] xl:self-start">
          <section className="card relative overflow-hidden bg-grad-dream text-center">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
            <p className="relative m-0 font-display text-2xl font-semibold text-ink">¿Qué vemos hoy?</p>
            <div className="relative mt-3 flex justify-center gap-2">
              {(['todas', 'peli', 'serie'] as const).map((k) => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{k === 'todas' ? 'Todo' : k === 'peli' ? 'Pelis' : 'Series'}</Chip>)}
            </div>
            <div className="relative my-4 flex min-h-[210px] items-center justify-center">
              {picked ? (
                <div className={`w-[140px] transition-transform ${spinning ? 'scale-95' : 'scale-100'}`}><Poster m={picked} className="shadow-[0_14px_28px_rgba(124,92,219,.3)]" /></div>
              ) : (
                <LoopyMascot size={120} expression={spinning ? 'celebrating' : 'thinking'} />
              )}
            </div>
            {picked && !spinning && <p className="relative m-0 mb-3 font-display text-lg font-semibold text-plum">{picked.titulo}</p>}
            <div className="relative flex flex-col gap-2">
              <Button variant="primary-soft" onClick={spin} disabled={!pool.length || spinning}>
                <Icon name="dice" bare size={20} />{!pool.length ? 'No hay nada por ver' : spinning ? 'Pensando…' : picked ? 'Otra vez' : 'Girar la ruleta'}
              </Button>
              {picked && !spinning && (
                <Button onClick={() => { patch(picked.id, { estado: 'viendo' }); setPicked(null); setTab('viendo') }}>¡Esta! Empezar a verla</Button>
              )}
            </div>
          </section>
        </aside>
      </div>

      {adding && <AddModal onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load() }} />}
      {open && <Detail movie={open} onClose={() => setOpenId(null)} onChange={(p) => patch(open.id, p)} onDelete={() => remove(open.id)} />}
    </Page>
  )
}
