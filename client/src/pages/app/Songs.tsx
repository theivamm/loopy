import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { notifyPartner } from '../../lib/push'
import { detectPlatform, embedFor, ETIQUETAS, PLATFORM_LABEL, REACCIONES } from '../../lib/music'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Page, PageHeader, Chip, IconBtn } from '../../components/ui/PageShell'
import type { Song } from '../../types/db'

const API_URL = import.meta.env.VITE_API_URL as string
type Filter = 'todas' | 'mias' | 'pareja' | 'nuestra'

const todayISO = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function Cover({ song, size, round }: { song: Song; size: number; round?: boolean }) {
  return song.imagen ? (
    <img src={song.imagen} alt="" className={`shrink-0 object-cover ${round ? 'rounded-full' : 'rounded-[22px]'}`} style={{ width: size, height: size }} />
  ) : (
    <Icon name="musica" size={size} className={round ? '!rounded-full' : ''} />
  )
}

function Vinyl({ song, fast }: { song: Song; fast: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: 210, height: 210 }}>
      <div
        className="absolute inset-0 rounded-full shadow-[0_18px_36px_rgba(46,36,64,.35)]"
        style={{
          background: 'repeating-radial-gradient(circle at center, #2A2236 0 2px, #1B1528 2px 4px)',
          animation: `loopy-vinyl ${fast ? 5 : 22}s linear infinite`,
        }}
      >
        <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 20deg, transparent 0 20%, rgba(255,255,255,.14) 28%, transparent 36% 70%, rgba(255,255,255,.10) 78%, transparent 86%)' }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-4 ring-[#1B1528]" style={{ width: 84, height: 84 }}>
          {song.imagen ? <img src={song.imagen} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-grad-loop" />}
        </div>
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream" />
      </div>
    </div>
  )
}

/* ───────── Composer ───────── */
function Composer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { space, user } = useAuth()
  const [url, setUrl] = useState('')
  const [titulo, setTitulo] = useState('')
  const [artista, setArtista] = useState('')
  const [nota, setNota] = useState('')
  const [etiqueta, setEtiqueta] = useState<string | null>(null)
  const [dedicada, setDedicada] = useState(false)
  const [hoy, setHoy] = useState(false)
  const [saving, setSaving] = useState(false)
  const platform = detectPlatform(url)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user) return
    setSaving(true)
    let imagen: string | null = null, plataforma: string | null = platform === 'other' ? null : platform
    let autoTitulo: string | null = null, autoArtista: string | null = null
    if (url.trim()) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const res = await fetch(`${API_URL}/api/song-preview?url=${encodeURIComponent(url)}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
          if (res.ok) {
            const p = await res.json()
            imagen = p.imagen; plataforma = p.plataforma ?? plataforma; autoTitulo = p.titulo; autoArtista = p.artista
          }
        }
      } catch { /* preview opcional */ }
    }
    if (hoy) await supabase.from('songs').update({ es_del_dia: false }).eq('space_id', space.id)
    const { data } = await supabase.from('songs').insert({
      space_id: space.id, agregado_por: user.id,
      titulo: titulo.trim() || autoTitulo || 'Sin título',
      artista: artista.trim() || autoArtista || null,
      url: url.trim() || null, nota: nota.trim() || null, imagen, plataforma,
      etiqueta, dedicada, es_del_dia: hoy, del_dia_fecha: hoy ? todayISO() : null,
    }).select('id').single()
    if (data && (dedicada || hoy)) notifyPartner('song', data.id)
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-sm md:items-center md:p-8" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="animate-sheet md:animate-pop flex max-h-[92vh] w-full max-w-[560px] flex-col gap-4 overflow-y-auto rounded-t-[40px] bg-cream p-6 md:rounded-[40px] md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl text-ink">Agregar canción</h2>
          <IconBtn icon="close" label="Cerrar" onClick={onClose} />
        </div>
        <div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link de Spotify, YouTube o Apple Music" className="field" />
          {url && <p className="m-0 mt-2 pl-2 text-xs font-bold text-ink-soft">{embedFor(url) ? `Se podrá escuchar acá mismo · ${PLATFORM_LABEL[platform]}` : 'Se guardará como link externo'}</p>}
        </div>
        <input required={!url.trim()} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={url ? 'Título (se completa solo si podemos)' : 'Título de la canción'} className="field" />
        <input value={artista} onChange={(e) => setArtista(e.target.value)} placeholder="Artista (opcional)" className="field" />
        <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Dedicatoria o nota (opcional)" className="field font-hand text-[22px]" maxLength={160} />
        <div>
          <p className="eyebrow m-0 mb-2">Para qué momento</p>
          <div className="flex flex-wrap gap-2">
            {ETIQUETAS.map((t) => (
              <button type="button" key={t} onClick={() => setEtiqueta(etiqueta === t ? null : t)} className={`rounded-full px-4 py-2 text-[13px] font-bold transition-all ${etiqueta === t ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {([[dedicada, setDedicada, 'heart', 'Dedicársela a mi pareja', 'Le llega un aviso con la canción.'], [hoy, setHoy, 'star', 'Hacerla la canción de hoy', 'Aparece destacada en el disco.']] as const).map(([v, set, ic, t, d]) => (
            <button type="button" key={t} onClick={() => set(!v)} className={`flex items-center gap-3 rounded-[26px] py-2 pl-2 pr-5 text-left transition-all ${v ? 'bg-lilac-mist shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft'}`}>
              <Icon name={ic} size={42} />
              <span><span className={`block text-sm font-bold ${v ? 'text-plum' : 'text-ink'}`}>{t}</span><span className="block text-xs text-ink-soft">{d}</span></span>
            </button>
          ))}
        </div>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Agregar'}</Button>
      </form>
    </div>
  )
}

/* ───────── Página ───────── */
export default function Songs() {
  const { space, user } = useAuth()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [composer, setComposer] = useState(false)
  const [filter, setFilter] = useState<Filter>('todas')
  const [tag, setTag] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [playing, setPlaying] = useState<Song | null>(null)
  const today = todayISO()

  async function load() {
    if (!space) return
    const { data } = await supabase.from('songs').select('*').eq('space_id', space.id).order('fecha', { ascending: false })
    setSongs(((data as Song[]) ?? []).map((s) => ({ ...s, reacciones: s.reacciones ?? {} })))
    setLoading(false)
  }
  useEffect(() => { load() }, [space])
  useEffect(() => {
    if (!space) return
    const ch = supabase.channel(`songs-${space.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs', filter: `space_id=eq.${space.id}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [space])

  const patch = (id: string, p: Partial<Song>) => {
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, ...p } : s)))
    return supabase.from('songs').update(p).eq('id', id)
  }

  async function markToday(s: Song) {
    if (!space) return
    await supabase.from('songs').update({ es_del_dia: false }).eq('space_id', space.id)
    await patch(s.id, { es_del_dia: true, del_dia_fecha: today })
    notifyPartner('song', s.id)
    load()
  }
  async function toggleNuestra(s: Song) {
    if (!space) return
    if (!s.es_nuestra) await supabase.from('songs').update({ es_nuestra: false }).eq('space_id', space.id)
    await patch(s.id, { es_nuestra: !s.es_nuestra })
    load()
  }
  function react(s: Song, key: string) {
    if (!user) return
    const r = { ...s.reacciones }
    if (r[user.id] === key) delete r[user.id]
    else r[user.id] = key
    patch(s.id, { reacciones: r })
  }
  async function remove(id: string) {
    if (!confirm('¿Sacar esta canción?')) return
    if (playing?.id === id) setPlaying(null)
    await supabase.from('songs').delete().eq('id', id)
    load()
  }
  function surprise() {
    const pool = songs.filter((s) => s.id !== playing?.id)
    if (pool.length) setPlaying(pool[Math.floor(Math.random() * pool.length)])
  }

  const dayStats = useMemo(() => {
    const dates = new Set(songs.map((s) => s.del_dia_fecha).filter(Boolean) as string[])
    let streak = 0
    const d = new Date()
    if (!dates.has(today)) d.setDate(d.getDate() - 1)
    for (;;) {
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      if (!dates.has(iso)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    const mine = songs.filter((s) => s.agregado_por === user?.id).length
    const tagCount: Record<string, number> = {}
    songs.forEach((s) => s.etiqueta && (tagCount[s.etiqueta] = (tagCount[s.etiqueta] ?? 0) + 1))
    const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const history = songs.filter((s) => s.del_dia_fecha).sort((a, b) => (a.del_dia_fecha! < b.del_dia_fecha! ? 1 : -1)).slice(0, 7)
    return { streak, mine, theirs: songs.length - mine, topTag, history }
  }, [songs, user, today])

  const songToday = songs.find((s) => s.del_dia_fecha === today)
  const lastDay = songToday ?? songs.find((s) => s.es_del_dia)
  const nuestra = songs.find((s) => s.es_nuestra)
  const usedTags = ETIQUETAS.filter((t) => songs.some((s) => s.etiqueta === t))

  const shown = songs.filter((s) => {
    if (filter === 'mias' && s.agregado_por !== user?.id) return false
    if (filter === 'pareja' && s.agregado_por === user?.id) return false
    if (filter === 'nuestra' && !s.es_nuestra) return false
    if (tag && s.etiqueta !== tag) return false
    const t = q.trim().toLowerCase()
    return !t || s.titulo.toLowerCase().includes(t) || (s.artista ?? '').toLowerCase().includes(t)
  })

  const embed = playing ? embedFor(playing.url) : null

  const playerBody = playing ? (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Cover song={playing} size={44} />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-sm font-bold text-ink">{playing.titulo}</p>
          <p className="m-0 truncate text-xs text-ink-soft">{playing.artista}</p>
        </div>
        <IconBtn icon="close" label="Cerrar reproductor" onClick={() => setPlaying(null)} />
      </div>
      {embed ? (
        <iframe key={playing.id} src={embed.src} title={playing.titulo} width="100%" height={embed.height} loading="lazy" allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture" className="rounded-[20px] border-0" />
      ) : playing.url ? (
        <a href={playing.url} target="_blank" rel="noreferrer" className="no-underline"><Button className="w-full"><Icon name="play" bare size={18} tone="lavender" />Abrir en {PLATFORM_LABEL[detectPlatform(playing.url)]}</Button></a>
      ) : (
        <p className="m-0 text-center text-sm text-ink-soft">Esta canción no tiene link.</p>
      )}
    </div>
  ) : null

  return (
    <Page max={1500}>
      <PageHeader
        icon="musica"
        title="Música"
        subtitle="Su banda sonora, juntos."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={surprise} disabled={songs.length < 2}><Icon name="dice" bare size={18} />Sorprendeme</Button>
            <Button onClick={() => setComposer(true)}><Icon name="plus" bare size={20} tone="lavender" />Agregar</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Canción del día */}
          {lastDay ? (
            <section className="card relative flex flex-col items-center gap-8 overflow-hidden !p-8 sm:flex-row md:!p-10" style={{ background: 'linear-gradient(135deg,#E4D9FF,#FFD3E2 60%,#FFE0D2)' }}>
              <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
              <Vinyl song={lastDay} fast={playing?.id === lastDay.id} />
              <div className="relative flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                <span className="eyebrow">{songToday ? 'Canción del día · hoy' : 'Última canción del día'}</span>
                <h2 className="m-0 text-balance text-[32px] leading-[1.05] text-ink md:text-[40px]">{lastDay.titulo}</h2>
                {lastDay.artista && <p className="m-0 text-lg text-ink-soft">{lastDay.artista}</p>}
                {lastDay.nota && (
                  <p className="m-0 rounded-[26px] bg-white/70 px-5 py-2 font-hand text-[26px] leading-tight text-ink">
                    “{lastDay.nota}” <span className="text-base font-bold text-ink-soft">— {lastDay.agregado_por === user?.id ? 'vos' : 'tu pareja'}</span>
                  </p>
                )}
                <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button onClick={() => setPlaying(lastDay)}><Icon name="play" bare size={18} tone="lavender" />Reproducir</Button>
                  {lastDay.url && <a href={lastDay.url} target="_blank" rel="noreferrer" className="no-underline"><Button variant="secondary">Abrir en {PLATFORM_LABEL[detectPlatform(lastDay.url)]}</Button></a>}
                </div>
              </div>
            </section>
          ) : (
            <section className="card flex flex-col items-center gap-3 bg-white/70 py-12 text-center">
              <LoopyMascot size={110} expression="thinking" />
              <h2 className="m-0 text-2xl text-ink">¿Cuál es la canción de hoy?</h2>
              <p className="m-0 max-w-sm text-ink-soft">Elegí una para dedicársela. Aparece acá, girando en el disco.</p>
              <Button onClick={() => setComposer(true)}><Icon name="plus" bare size={20} tone="lavender" />Agregar canción</Button>
            </section>
          )}

          {/* Nuestra canción */}
          {nuestra && (
            <button onClick={() => setPlaying(nuestra)} className="card card-lift flex items-center gap-4 text-left" style={{ background: 'linear-gradient(135deg,#FFE9A8,#FFC9DB)' }}>
              <Icon name="crown" size={56} />
              <div className="min-w-0 flex-1">
                <p className="eyebrow m-0">Nuestra canción</p>
                <p className="m-0 truncate font-display text-2xl font-semibold text-ink">{nuestra.titulo}</p>
                {nuestra.artista && <p className="m-0 truncate text-sm text-ink-soft">{nuestra.artista}</p>}
              </div>
              <Icon name="play" size={46} />
            </button>
          )}

          {/* Filtros */}
          <div className="flex flex-col gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título o artista…" className="field max-w-md" />
            <div className="flex flex-wrap gap-2">
              {(['todas', 'mias', 'pareja', 'nuestra'] as Filter[]).map((f) => (
                <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{{ todas: `Todas · ${songs.length}`, mias: 'Mías', pareja: 'De mi pareja', nuestra: 'Nuestra' }[f]}</Chip>
              ))}
              {usedTags.map((t) => <Chip key={t} tone="peach" active={tag === t} onClick={() => setTag(tag === t ? null : t)}>{t}</Chip>)}
            </div>
          </div>

          {/* Lista */}
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            {!loading && shown.length === 0 && <p className="card col-span-full m-0 py-10 text-center text-ink-soft">No hay canciones con ese filtro.</p>}
            {shown.map((s) => {
              const mine = s.agregado_por === user?.id
              const isNow = playing?.id === s.id
              return (
                <article key={s.id} className={`card card-lift flex flex-col gap-3 !p-5 ${isNow ? 'outline outline-[3px] outline-plum' : ''}`}>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setPlaying(s)} className="group relative shrink-0" aria-label={`Reproducir ${s.titulo}`}>
                      <Cover song={s} size={68} />
                      <span className="absolute inset-0 grid place-items-center rounded-[22px] bg-ink/40 opacity-0 transition-opacity group-hover:opacity-100"><Icon name="play" bare size={26} className="[&_*]:!fill-white" /></span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate font-bold text-ink">{s.titulo}</p>
                      {s.artista && <p className="m-0 truncate text-sm text-ink-soft">{s.artista}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-muted"><i className="h-2 w-2 rounded-full" style={{ background: mine ? '#7C5CDB' : '#F2733F' }} />{mine ? 'Vos' : 'Tu pareja'}</span>
                        {s.url && <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-ink-soft">{PLATFORM_LABEL[detectPlatform(s.url)]}</span>}
                        {s.etiqueta && <Chip tone="peach">{s.etiqueta}</Chip>}
                        {s.dedicada && <Chip tone="blush"><Icon name="heart" bare size={12} />Dedicada</Chip>}
                      </div>
                    </div>
                  </div>
                  {s.nota && <p className="m-0 rounded-[20px] bg-[#FFF8E1] px-4 py-2 font-hand text-[22px] leading-tight text-ink">“{s.nota}”</p>}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      {REACCIONES.map((r) => {
                        const my = user && s.reacciones[user.id] === r.key
                        const their = Object.entries(s.reacciones).some(([uid, k]) => uid !== user?.id && k === r.key)
                        return (
                          <button key={r.key} onClick={() => react(s, r.key)} title={r.label} aria-label={r.label}
                            className={`relative grid h-9 w-9 place-items-center rounded-full transition-all hover:scale-110 active:scale-90 ${my ? 'bg-lilac-mist shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft'}`}>
                            <Icon name={r.icon} bare size={18} />
                            {their && <i className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-white" />}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      <IconBtn icon="star" label={s.del_dia_fecha === today ? 'Es la canción de hoy' : 'Hacerla canción del día'} onClick={() => markToday(s)} />
                      <IconBtn icon="crown" label={s.es_nuestra ? 'Quitar de nuestra canción' : 'Hacerla nuestra canción'} onClick={() => toggleNuestra(s)} />
                      {mine && <IconBtn icon="trash" label="Sacar" danger onClick={() => remove(s.id)} />}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {/* Aside */}
        <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-[92px] xl:self-start">
          <section className="card hidden xl:block">
            <div className="mb-3 flex items-center gap-2.5"><Icon name="headphones" size={32} /><span className="eyebrow">Reproductor</span></div>
            {playerBody ?? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <LoopyMascot size={84} expression="happy" />
                <p className="m-0 text-sm text-ink-soft">Elegí una canción y suena acá mismo.</p>
              </div>
            )}
          </section>

          <section className="card flex flex-col gap-4">
            <div className="flex items-center gap-2.5"><Icon name="sparkle" size={32} /><span className="eyebrow">Su banda sonora</span></div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-[24px] bg-lilac-mist p-3"><p className="m-0 font-display text-3xl font-semibold text-plum">{songs.length}</p><p className="m-0 text-xs font-bold text-ink-soft">canciones</p></div>
              <div className="rounded-[24px] bg-[#FFE9DF] p-3"><p className="m-0 font-display text-3xl font-semibold text-[#F2733F]">{dayStats.streak}</p><p className="m-0 text-xs font-bold text-ink-soft">días seguidos</p></div>
              <div className="rounded-[24px] bg-[#FFF8E1] p-3"><p className="m-0 font-display text-3xl font-semibold text-[#D79A00]">{dayStats.history.length}</p><p className="m-0 text-xs font-bold text-ink-soft">del día</p></div>
            </div>
            {songs.length > 0 && (
              <div>
                <div className="flex h-3.5 overflow-hidden rounded-full bg-surface-soft">
                  <div style={{ width: `${(dayStats.mine / songs.length) * 100}%`, background: '#C9B8FF' }} />
                  <div style={{ width: `${(dayStats.theirs / songs.length) * 100}%`, background: '#FFC2A8' }} />
                </div>
                <div className="mt-2 flex justify-between text-xs font-bold text-ink-soft"><span>Vos · {dayStats.mine}</span><span>Tu pareja · {dayStats.theirs}</span></div>
              </div>
            )}
            {dayStats.topTag && <p className="m-0 text-sm text-ink-soft">Lo que más suena: <b className="text-ink">{dayStats.topTag}</b></p>}
          </section>

          {dayStats.history.length > 0 && (
            <section className="card flex flex-col gap-3">
              <div className="flex items-center gap-2.5"><Icon name="calendario" size={32} /><span className="eyebrow">Canciones del día</span></div>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {dayStats.history.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => setPlaying(s)} className="flex w-full items-center gap-3 rounded-full bg-surface-soft py-1.5 pl-1.5 pr-4 text-left transition-colors hover:bg-white">
                      <Cover song={s} size={36} round />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-ink">{s.titulo}</span><span className="block truncate text-xs text-ink-soft">{s.artista}</span></span>
                      <span className="text-xs font-bold text-ink-muted">{new Date(s.del_dia_fecha + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* Reproductor móvil */}
      {playing && (
        <div className="animate-pop fixed inset-x-3 bottom-[104px] z-40 rounded-[28px] bg-white p-3 shadow-[var(--shadow-fluffy-lg)] xl:hidden">{playerBody}</div>
      )}

      {composer && <Composer onClose={() => setComposer(false)} onSaved={() => { setComposer(false); load() }} />}
    </Page>
  )
}
