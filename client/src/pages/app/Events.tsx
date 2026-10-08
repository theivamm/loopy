import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon, TONES, type IconName, type Tone } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Page, PageHeader, Chip } from '../../components/ui/PageShell'
import type { Event } from '../../types/db'

const TIPOS: { key: string; icon: IconName; tone: Tone }[] = [
  { key: 'general', icon: 'star', tone: 'lavender' },
  { key: 'cita', icon: 'heart', tone: 'blush' },
  { key: 'aniversario', icon: 'cake', tone: 'peach' },
  { key: 'viaje', icon: 'plane', tone: 'sky' },
  { key: 'cumpleaños', icon: 'gift', tone: 'butter' },
]
const tipoOf = (k: string | null) => TIPOS.find((t) => t.key === k) ?? TIPOS[0]
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface Occ { key: string; ev: Event | null; titulo: string; tipo: string; date: Date; recurrente?: boolean }

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const toLocalInput = (d: Date) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16) }

function occIn(events: Event[], year: number, month: number, anniv: string | null | undefined): Occ[] {
  const out: Occ[] = []
  const dim = new Date(year, month + 1, 0).getDate()
  for (const ev of events) {
    const b = new Date(ev.inicio)
    if (!ev.recurrencia) {
      if (b.getFullYear() === year && b.getMonth() === month) out.push({ key: ev.id, ev, titulo: ev.titulo, tipo: ev.tipo ?? 'general', date: b })
    } else if (ev.recurrencia === 'anual') {
      if (b.getMonth() === month && year >= b.getFullYear()) out.push({ key: `${ev.id}-${year}`, ev, titulo: ev.titulo, tipo: ev.tipo ?? 'general', date: new Date(year, month, b.getDate(), b.getHours(), b.getMinutes()), recurrente: true })
    } else if (ev.recurrencia === 'mensual') {
      const started = year > b.getFullYear() || (year === b.getFullYear() && month >= b.getMonth())
      if (started && b.getDate() <= dim) out.push({ key: `${ev.id}-${year}-${month}`, ev, titulo: ev.titulo, tipo: ev.tipo ?? 'general', date: new Date(year, month, b.getDate(), b.getHours(), b.getMinutes()), recurrente: true })
    }
  }
  if (anniv) {
    const a = new Date(anniv + 'T00:00')
    if (a.getMonth() === month && year > a.getFullYear()) {
      out.push({ key: `anniv-${year}`, ev: null, titulo: `Aniversario · ${year - a.getFullYear()} ${year - a.getFullYear() === 1 ? 'año' : 'años'}`, tipo: 'aniversario', date: new Date(year, month, a.getDate()), recurrente: true })
    }
  }
  return out.sort((x, y) => x.date.getTime() - y.date.getTime())
}

/* ───── Formulario ───── */
function EventForm({ initial, defaultDate, onClose, onSaved }: { initial: Event | null; defaultDate: Date; onClose: () => void; onSaved: () => void }) {
  const { space, user } = useAuth()
  const base = initial ? new Date(initial.inicio) : (() => { const d = new Date(defaultDate); d.setHours(20, 0, 0, 0); return d })()
  const [titulo, setTitulo] = useState(initial?.titulo ?? '')
  const [inicio, setInicio] = useState(toLocalInput(base))
  const [tipo, setTipo] = useState(initial?.tipo ?? 'general')
  const [rec, setRec] = useState<string>(initial?.recurrencia ?? 'no')
  const [recordatorio, setRecordatorio] = useState(initial?.recordatorio ?? true)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!space || !user || !titulo.trim() || !inicio) return
    setSaving(true)
    const row = { titulo: titulo.trim(), inicio: new Date(inicio).toISOString(), tipo, recurrencia: rec === 'no' ? null : rec, recordatorio, recordado: 0 }
    if (initial) await supabase.from('events').update(row).eq('id', initial.id)
    else await supabase.from('events').insert({ ...row, space_id: space.id, creado_por: user.id })
    onSaved()
  }
  async function del() {
    if (!initial || !confirm('¿Eliminar este plan?')) return
    await supabase.from('events').delete().eq('id', initial.id)
    onSaved()
  }

  return (
    <Modal title={initial ? 'Editar plan' : 'Nuevo plan'} onClose={onClose}>
      <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="¿Qué van a hacer?" className="field" />
      <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className="field" />
      <div>
        <p className="eyebrow m-0 mb-2">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button type="button" key={t.key} onClick={() => setTipo(t.key)} className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[13px] font-bold capitalize transition-all ${tipo === t.key ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft'}`}><Icon name={t.icon} size={28} />{t.key}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="eyebrow m-0 mb-2">Repetir</p>
        <div className="flex rounded-full bg-surface-soft p-1">
          {[['no', 'No'], ['anual', 'Cada año'], ['mensual', 'Cada mes']].map(([k, l]) => (
            <button type="button" key={k} onClick={() => setRec(k)} className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-all ${rec === k ? 'bg-white text-plum shadow-[var(--shadow-loopy-sm)]' : 'text-ink-muted'}`}>{l}</button>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => setRecordatorio((v) => !v)} className={`flex items-center gap-3 rounded-[26px] py-2 pl-2 pr-5 text-left transition-all ${recordatorio ? 'bg-lilac-mist shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft'}`}>
        <Icon name="bell" size={42} />
        <span><span className={`block text-sm font-bold ${recordatorio ? 'text-plum' : 'text-ink'}`}>Recordarnos a los dos</span><span className="block text-xs text-ink-soft">Aviso un día antes y una hora antes.</span></span>
      </button>
      <div className="flex items-center justify-between gap-3">
        {initial ? <Button variant="danger" onClick={del}><Icon name="trash" bare size={18} />Eliminar</Button> : <span />}
        <Button onClick={save} disabled={saving || !titulo.trim()}>{initial ? 'Guardar' : 'Agendar'}</Button>
      </div>
    </Modal>
  )
}

/* ───── Página ───── */
export default function Events() {
  const { space } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [sel, setSel] = useState<Date>(new Date())
  const [form, setForm] = useState<{ ev: Event | null } | null>(null)

  async function load() {
    if (!space) return
    const from = new Date(Math.min(new Date(view.y, view.m - 1, 1).getTime(), Date.now() - 86400000)).toISOString()
    const { data } = await supabase.from('events').select('*').eq('space_id', space.id).or(`recurrencia.not.is.null,inicio.gte.${from}`).order('inicio')
    setEvents((data as Event[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space, view.y, view.m])
  useEffect(() => {
    if (!space) return
    const ch = supabase.channel(`events-${space.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `space_id=eq.${space.id}` }, () => load()).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [space, view.y, view.m])

  const anniv = space?.fecha_aniversario
  const monthOccs = useMemo(() => occIn(events, view.y, view.m, anniv), [events, view, anniv])
  const upcoming = useMemo(() => {
    const t = new Date()
    const all: Occ[] = []
    for (let i = 0; i < 13; i++) {
      const d = new Date(t.getFullYear(), t.getMonth() + i, 1)
      all.push(...occIn(events, d.getFullYear(), d.getMonth(), anniv))
    }
    return all.filter((o) => o.date.getTime() >= Date.now() - 3600_000).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [events, anniv])

  const next = upcoming[0]
  const days = next ? Math.max(0, Math.ceil((next.date.getTime() - Date.now()) / 86400000)) : 0
  const hours = next ? Math.max(0, Math.floor((next.date.getTime() - Date.now()) / 3600000)) : 0
  const next30 = upcoming.filter((o) => o.date.getTime() < Date.now() + 30 * 86400000)

  // grilla del mes (semana empieza lunes)
  const first = new Date(view.y, view.m, 1)
  const lead = (first.getDay() + 6) % 7
  const dim = new Date(view.y, view.m + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((lead + dim) / 7) * 7 }, (_, i) => (i < lead || i >= lead + dim ? null : new Date(view.y, view.m, i - lead + 1)))
  const selOccs = monthOccs.filter((o) => sameDay(o.date, sel))
  const monthName = first.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const go = (d: number) => setView((v) => { const n = new Date(v.y, v.m + d, 1); return { y: n.getFullYear(), m: n.getMonth() } })

  const occRow = (o: Occ) => {
    const t = tipoOf(o.tipo)
    return (
      <button key={o.key} onClick={() => o.ev && setForm({ ev: o.ev })} className={`flex w-full items-center gap-3 rounded-[26px] bg-surface-soft py-2 pl-2 pr-4 text-left transition-colors ${o.ev ? 'hover:bg-white' : 'cursor-default'}`}>
        <Icon name={t.icon} tone={t.tone} size={44} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{o.titulo}</span>
          <span className="block text-xs capitalize text-ink-soft">{o.date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}{o.ev || o.recurrente ? ` · ${o.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : ''}{o.recurrente ? ' · se repite' : ''}</span>
        </span>
      </button>
    )
  }

  return (
    <Page max={1500}>
      <PageHeader icon="calendario" title="Calendario" subtitle="Citas, viajes y fechas que importan." action={<Button onClick={() => setForm({ ev: null })}><Icon name="plus" bare size={20} tone="lavender" />Nuevo plan</Button>} />

      {/* Próximo */}
      <section className="card relative mb-6 flex flex-wrap items-center gap-6 overflow-hidden bg-grad-dream !p-7 md:!p-9">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/40 blur-3xl" />
        {next ? (
          <>
            <Icon name={tipoOf(next.tipo).icon} tone={tipoOf(next.tipo).tone} size={84} className="relative" />
            <div className="relative min-w-0 flex-1">
              <p className="eyebrow m-0">Lo próximo</p>
              <h2 className="m-0 mt-1 text-balance text-[28px] leading-tight text-ink md:text-[36px]">{next.titulo}</h2>
              <p className="m-0 mt-1 capitalize text-ink-soft">{next.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {next.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="relative flex gap-3">
              {(days > 1 ? [[days, days === 1 ? 'día' : 'días']] : [[hours, hours === 1 ? 'hora' : 'horas']]).map(([n, l]) => (
                <div key={String(l)} className="min-w-[120px] rounded-[30px] bg-white/80 px-6 py-4 text-center shadow-[var(--shadow-loopy-md)]">
                  <p className="m-0 font-display text-[44px] font-semibold leading-none text-plum">{n}</p>
                  <p className="m-0 mt-1 text-xs font-bold uppercase tracking-wide text-ink-soft">{l}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <LoopyMascot size={90} expression="thinking" />
            <div className="relative flex-1"><h2 className="m-0 text-2xl text-ink">Nada agendado todavía</h2><p className="m-0 mt-1 text-ink-soft">¿Planeamos algo lindo?</p></div>
            <Button onClick={() => setForm({ ev: null })} className="relative">Agendar un plan</Button>
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Mes */}
        <section className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="m-0 text-2xl capitalize text-ink">{monthName}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { setView({ y: now.getFullYear(), m: now.getMonth() }); setSel(new Date()) }} className="rounded-full bg-lilac-mist px-4 py-2 text-[13px] font-bold text-plum transition-all hover:bg-plum hover:text-white">Hoy</button>
              <button onClick={() => go(-1)} aria-label="Mes anterior" className="grid h-10 w-10 place-items-center rounded-full bg-surface-soft transition-transform hover:scale-110"><Icon name="caretLeft" bare size={18} /></button>
              <button onClick={() => go(1)} aria-label="Mes siguiente" className="grid h-10 w-10 place-items-center rounded-full bg-surface-soft transition-transform hover:scale-110"><Icon name="caretRight" bare size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {DOW.map((d) => <div key={d} className="pb-1 text-center text-xs font-extrabold text-ink-muted">{d}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const occs = monthOccs.filter((o) => sameDay(o.date, d))
              const isToday = sameDay(d, now)
              const isSel = sameDay(d, sel)
              return (
                <button key={i} onClick={() => setSel(d)} onDoubleClick={() => setForm({ ev: null })}
                  className={`flex aspect-square min-h-[52px] flex-col items-center justify-start gap-1 rounded-[20px] pt-2 text-sm font-bold transition-all md:min-h-[84px] md:aspect-auto md:rounded-[24px] ${
                    isSel ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : isToday ? 'bg-lilac-mist text-plum' : 'bg-surface-soft text-ink hover:bg-white'
                  }`}>
                  {d.getDate()}
                  <span className="flex flex-wrap justify-center gap-1 px-1">
                    {occs.slice(0, 3).map((o) => <i key={o.key} className="h-2 w-2 rounded-full ring-1 ring-white/70" style={{ background: TONES[tipoOf(o.tipo).tone].solid }} />)}
                  </span>
                  {occs.length > 0 && <span className="hidden max-w-full truncate px-1.5 text-[10px] font-semibold opacity-80 md:block">{occs[0].titulo}</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* Día + lista */}
        <aside className="flex flex-col gap-6">
          <section className="card flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="m-0 text-lg capitalize text-ink">{sel.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              <Button size="sm" variant="secondary" onClick={() => setForm({ ev: null })}><Icon name="plus" bare size={14} />Plan</Button>
            </div>
            {selOccs.length ? selOccs.map(occRow) : <p className="m-0 rounded-[22px] bg-surface-soft px-5 py-4 text-center text-sm text-ink-soft">Día libre. ¿Se les ocurre algo?</p>}
          </section>

          <section className="card flex flex-col gap-3">
            <div className="flex items-center justify-between"><span className="eyebrow">Próximos 30 días</span><Chip tone="sky">{next30.length}</Chip></div>
            {!loading && next30.length === 0 ? <p className="m-0 py-4 text-center text-sm text-ink-soft">Sin planes en el mes que viene.</p> : <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">{next30.map(occRow)}</div>}
          </section>
        </aside>
      </div>

      {form && <EventForm initial={form.ev} defaultDate={sel} onClose={() => setForm(null)} onSaved={() => { setForm(null); load() }} />}
    </Page>
  )
}
