import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Page, PageHeader, Chip, IconBtn } from '../../components/ui/PageShell'
import type { Idea } from '../../types/db'

type Estado = Idea['estado']
const CATEGORIES: { key: string; icon: IconName }[] = [
  { key: 'general', icon: 'ideas' }, { key: 'citas', icon: 'heart' }, { key: 'viajes', icon: 'plane' }, { key: 'regalos', icon: 'gift' }, { key: 'proyectos', icon: 'rocket' },
]
const catIcon = (c: string | null): IconName => CATEGORIES.find((x) => x.key === c)?.icon ?? 'ideas'
const COLS: { key: Estado; label: string; bg: string; hint: string; icon: IconName }[] = [
  { key: 'sonada', label: 'Soñadas', bg: '#F3EEFF', hint: 'Cosas que queremos hacer algún día', icon: 'sparkle' },
  { key: 'planeada', label: 'Planeadas', bg: '#EAF4FF', hint: 'Ya tienen fecha o están en camino', icon: 'calendario' },
  { key: 'hecha', label: 'Hechas', bg: '#E6F7EE', hint: 'Cumplidas juntos', icon: 'check' },
]
const COSTO = { bajo: '$', medio: '$$', alto: '$$$' } as const

function IdeaForm({ idea, onClose, onSaved }: { idea: Idea | null; onClose: () => void; onSaved: () => void }) {
  const { space, user } = useAuth()
  const [titulo, setTitulo] = useState(idea?.titulo ?? '')
  const [desc, setDesc] = useState(idea?.descripcion ?? '')
  const [cat, setCat] = useState(idea?.categoria ?? 'general')
  const [costo, setCosto] = useState<Idea['costo']>(idea?.costo ?? null)
  const [fecha, setFecha] = useState(idea?.fecha_objetivo ?? '')
  const [privada, setPrivada] = useState(idea?.privada ?? false)
  const [estado, setEstado] = useState<Estado>(idea?.estado ?? 'sonada')

  async function save() {
    if (!space || !user || !titulo.trim()) return
    const row = { titulo: titulo.trim(), descripcion: desc.trim() || null, categoria: cat, costo, fecha_objetivo: fecha || null, privada, estado }
    if (idea) await supabase.from('ideas').update(row).eq('id', idea.id)
    else await supabase.from('ideas').insert({ ...row, space_id: space.id, autor_id: user.id })
    onSaved()
  }
  async function del() {
    if (!idea || !confirm('¿Borrar la idea?')) return
    await supabase.from('ideas').delete().eq('id', idea.id)
    onSaved()
  }
  return (
    <Modal title={idea ? 'Editar idea' : 'Nueva idea'} onClose={onClose}>
      <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Una idea para los dos…" className="field" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Detalles (opcional)" className="field" />
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => <button type="button" key={c.key} onClick={() => setCat(c.key)} className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[13px] font-bold capitalize transition-all ${cat === c.key ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft'}`}><Icon name={c.icon} size={28} />{c.key}</button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="eyebrow m-0 mb-2">Presupuesto</p>
          <div className="flex rounded-full bg-surface-soft p-1">{([null, 'bajo', 'medio', 'alto'] as const).map((c) => <button type="button" key={String(c)} onClick={() => setCosto(c)} className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-all ${costo === c ? 'bg-white text-plum shadow-[var(--shadow-loopy-sm)]' : 'text-ink-muted'}`}>{c ? COSTO[c] : '—'}</button>)}</div></div>
        <div><p className="eyebrow m-0 mb-2">Fecha objetivo</p><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="field !h-11" /></div>
      </div>
      <div className="flex rounded-full bg-surface-soft p-1">{COLS.map((c) => <button type="button" key={c.key} onClick={() => setEstado(c.key)} className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-all ${estado === c.key ? 'bg-white text-plum shadow-[var(--shadow-loopy-sm)]' : 'text-ink-muted'}`}>{c.label}</button>)}</div>
      <button type="button" onClick={() => setPrivada((v) => !v)} className={`flex items-center gap-3 rounded-[26px] py-2 pl-2 pr-5 text-left transition-all ${privada ? 'bg-lilac-mist shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft'}`}>
        <Icon name="lock" size={42} /><span><span className="block text-sm font-bold text-ink">Idea secreta</span><span className="block text-xs text-ink-soft">Solo vos la ves (ideal para regalos sorpresa).</span></span>
      </button>
      <div className="flex items-center justify-between gap-3">{idea ? <Button variant="danger" onClick={del}><Icon name="trash" bare size={18} />Borrar</Button> : <span />}<Button onClick={save} disabled={!titulo.trim()}>Guardar</Button></div>
    </Modal>
  )
}

export default function Ideas() {
  const { space, user } = useAuth()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<{ i: Idea | null } | null>(null)
  const [col, setCol] = useState<Estado>('sonada')
  const [cat, setCat] = useState<string | null>(null)
  const [pick, setPick] = useState<Idea | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  async function load() {
    if (!space || !user) return
    const { data } = await supabase.from('ideas').select('*').eq('space_id', space.id).or(`privada.eq.false,autor_id.eq.${user.id}`).order('creado_en', { ascending: false })
    setIdeas(((data as Idea[]) ?? []).map((i) => ({ ...i, votos_por: i.votos_por ?? [], estado: i.estado ?? 'sonada' })))
    setLoading(false)
  }
  useEffect(() => { load() }, [space, user])
  useEffect(() => {
    if (!space) return
    const ch = supabase.channel(`ideas-${space.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `space_id=eq.${space.id}` }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [space, user])

  async function patch(id: string, p: Partial<Idea>) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)))
    await supabase.from('ideas').update(p).eq('id', id)
  }
  function vote(i: Idea) {
    if (!user) return
    const s = new Set(i.votos_por)
    s.has(user.id) ? s.delete(user.id) : s.add(user.id)
    patch(i.id, { votos_por: [...s], votos: s.size })
  }
  async function schedule(i: Idea) {
    if (!space || !user || !i.fecha_objetivo) return
    const d = new Date(i.fecha_objetivo + 'T20:00')
    await supabase.from('events').insert({ space_id: space.id, creado_por: user.id, titulo: i.titulo, inicio: d.toISOString(), tipo: i.categoria === 'viajes' ? 'viaje' : 'cita' })
    setFlash('Agendada en el calendario.')
    setTimeout(() => setFlash(null), 2200)
  }
  function surprise() {
    const pool = ideas.filter((i) => i.estado === 'sonada')
    if (pool.length) setPick(pool[Math.floor(Math.random() * pool.length)])
  }

  const visible = ideas.filter((i) => !cat || i.categoria === cat)
  const card = (i: Idea) => {
    const mine = i.autor_id === user?.id
    const voted = !!user && i.votos_por.includes(user.id)
    const next: Estado | null = i.estado === 'sonada' ? 'planeada' : i.estado === 'planeada' ? 'hecha' : null
    return (
      <article key={i.id} className="card card-lift flex flex-col gap-3 !p-5">
        <div className="flex items-start gap-3">
          <Icon name={catIcon(i.categoria)} size={46} />
          <div className="min-w-0 flex-1">
            <p className="m-0 flex items-center gap-1.5 font-bold leading-snug text-ink"><span className="min-w-0 break-words">{i.titulo}</span>{i.privada && <Icon name="lock" bare size={14} />}</p>
            <p className="m-0 flex items-center gap-1.5 text-[11px] font-bold text-ink-muted"><i className="h-2 w-2 rounded-full" style={{ background: mine ? '#7C5CDB' : '#F2733F' }} />{mine ? 'Vos' : 'Tu pareja'}<span className="capitalize">· {i.categoria}</span></p>
          </div>
          {mine && <IconBtn icon="edit" label="Editar" onClick={() => setForm({ i })} />}
        </div>
        {i.descripcion && <p className="m-0 line-clamp-3 text-sm text-ink-soft">{i.descripcion}</p>}
        <div className="flex flex-wrap gap-1.5">
          {i.costo && <Chip tone="mint">{COSTO[i.costo]}</Chip>}
          {i.fecha_objetivo && <Chip tone="sky"><Icon name="calendario" bare size={14} />{new Date(i.fecha_objetivo + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</Chip>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <button onClick={() => vote(i)} className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-all hover:scale-105 active:scale-90 ${voted ? 'bg-[#FFC9DB] text-[#C2467A]' : 'bg-surface-soft text-ink-soft'}`} aria-label="Me gusta">
            <Icon name="heart" bare size={18} tone={voted ? 'blush' : 'lavender'} />{i.votos_por.length || ''}
          </button>
          <div className="flex gap-2">
            {i.estado === 'planeada' && i.fecha_objetivo && <Button size="sm" variant="secondary" onClick={() => schedule(i)}>Agendar</Button>}
            {next && <Button size="sm" onClick={() => patch(i.id, { estado: next })}>{next === 'planeada' ? 'Planear' : '¡Hecha!'}<Icon name="arrow" bare size={14} /></Button>}
          </div>
        </div>
      </article>
    )
  }

  return (
    <Page max={1500}>
      <PageHeader icon="ideas" title="Ideas" subtitle="Lo que sueñan, planean y cumplen juntos." action={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={surprise}><Icon name="dice" bare size={18} />Sorprendeme</Button>
          <Button onClick={() => setForm({ i: null })}><Icon name="plus" bare size={20} tone="lavender" />Agregar</Button>
        </div>
      } />

      {pick && (
        <div className="card animate-pop mb-6 flex flex-wrap items-center gap-4 bg-grad-sunny !p-5">
          <Icon name={catIcon(pick.categoria)} size={60} />
          <div className="min-w-0 flex-1"><p className="eyebrow m-0">Hoy podrían…</p><p className="m-0 font-display text-2xl font-semibold text-ink">{pick.titulo}</p></div>
          <Button variant="secondary" onClick={surprise}>Otra</Button>
          <Button onClick={() => { patch(pick.id, { estado: 'planeada' }); setPick(null); setCol('planeada') }}>Planearla</Button>
        </div>
      )}

      {ideas.length > 0 && (
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={cat === null} onClick={() => setCat(null)}>Todas</Chip>
          {CATEGORIES.map((c) => <Chip key={c.key} active={cat === c.key} onClick={() => setCat(cat === c.key ? null : c.key)}><Icon name={c.icon} bare size={14} /><span className="capitalize">{c.key}</span></Chip>)}
        </div>
      )}

      {/* móvil: selector de columna */}
      <div className="mb-5 flex rounded-full bg-white/80 p-1.5 shadow-[var(--shadow-loopy-sm)] lg:hidden">
        {COLS.map((c) => <button key={c.key} onClick={() => setCol(c.key)} className={`flex-1 rounded-full py-2.5 text-[13px] font-bold transition-all ${col === c.key ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'text-ink-soft'}`}>{c.label} · {visible.filter((i) => i.estado === c.key).length}</button>)}
      </div>

      {!loading && ideas.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 bg-white/70 py-14 text-center"><LoopyMascot size={110} expression="thinking" /><p className="m-0 max-w-xs text-ink-soft">Todavía no hay ideas. ¿Tiramos la primera?</p><Button onClick={() => setForm({ i: null })}>Agregar idea</Button></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {COLS.map((c) => {
            const list = visible.filter((i) => i.estado === c.key)
            return (
              <section key={c.key} className={`flex-col gap-4 rounded-[40px] p-4 md:p-5 ${col === c.key ? 'flex' : 'hidden'} lg:flex`} style={{ background: c.bg + 'B3' }}>
                <div className="flex items-center gap-3 px-2 pt-1"><Icon name={c.icon} size={40} /><div><h2 className="m-0 text-xl text-ink">{c.label} <span className="text-base text-ink-muted">· {list.length}</span></h2><p className="m-0 text-xs text-ink-soft">{c.hint}</p></div></div>
                {list.length ? list.map(card) : <p className="m-0 rounded-[26px] bg-white/60 px-5 py-8 text-center text-sm text-ink-muted">Nada por acá.</p>}
              </section>
            )
          })}
        </div>
      )}

      {form && <IdeaForm idea={form.i} onClose={() => setForm(null)} onSaved={() => { setForm(null); load() }} />}
      {flash && <div className="animate-pop fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-loopy-lg)] md:bottom-8">{flash}</div>}
    </Page>
  )
}
