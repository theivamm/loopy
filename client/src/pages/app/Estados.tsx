import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import { InteractiveLoopy } from '../../components/ui/InteractiveLoopy'
import { Icon, MOODS, MoodIcon } from '../../components/ui/Icon'
import { Page, PageHeader, Chip } from '../../components/ui/PageShell'
import { notifyPartner } from '../../lib/push'
import { WeekMoods } from '../../components/home/WeekMoods'
import {
  ACTIVIDADES, UBICACIONES, REACCIONES, FRASES, VENCIMIENTOS, venceDesde, myTimezone,
  localTime, cityOf, energyLabel, energyColor, timeAgo, themeFor, effective, type Theme,
} from '../../lib/statusMeta'
import type { Invitation, Reaction, Status, Touch } from '../../types/db'

type Disp = NonNullable<Status['disponibilidad']>
const DISPONIBILIDAD: { key: Disp; label: string; dot: string }[] = [
  { key: 'libre', label: 'Libre', dot: '#2FAE7F' },
  { key: 'ocupado', label: 'Ocupado', dot: '#F2733F' },
  { key: 'no_molestar', label: 'No molestar', dot: '#E5586F' },
]

function MoodAura({ mine, partner }: { mine: string | null; partner: string | null }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      <div className="absolute -left-20 top-10 h-[520px] w-[520px] rounded-full opacity-50 blur-[110px] transition-[background] duration-[1400ms]" style={{ background: themeFor(partner).aura }} />
      <div className="absolute -right-24 bottom-0 h-[520px] w-[520px] rounded-full opacity-50 blur-[110px] transition-[background] duration-[1400ms]" style={{ background: themeFor(mine).aura }} />
    </div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow m-0">{children}</p>
}

function Battery({ value }: { value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px] font-bold text-ink-soft">
        <span className="flex items-center gap-1.5"><Icon name="bolt" bare size={18} /> Batería social</span>
        <span className="text-ink">{energyLabel(value)} · {value}%</span>
      </div>
      <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-white/70 shadow-[inset_0_2px_4px_rgba(124,92,219,.12)]">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${value}%`, background: energyColor(value) }} />
      </div>
    </div>
  )
}

interface ViewProps {
  eyebrow: string
  theme: Theme
  moodKey: string | null
  moodLabel: string
  sub?: string
  timeChip?: string
  disp?: Disp | null
  actividad?: string | null
  actividadTipo?: string | null
  ubicacion?: string | null
  vence?: string | null
  mensaje?: string | null
  energia?: number | null
  empty?: ReactNode
  footer?: ReactNode
  locked?: boolean
}

/** Tarjeta "escenario": Loopy a la izquierda, datos a la derecha. */
function StatusView(v: ViewProps) {
  const act = ACTIVIDADES.find((a) => a.key === v.actividadTipo)
  const loc = UBICACIONES.find((u) => u.key === v.ubicacion)
  const disp = DISPONIBILIDAD.find((d) => d.key === v.disp)
  return (
    <section className="card relative flex flex-col gap-6 overflow-hidden transition-[background] duration-700" style={{ background: v.theme.card }}>
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/50 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>{v.eyebrow}</Eyebrow>
        {v.timeChip && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 py-1 pl-1.5 pr-3 text-[13px] font-bold text-ink">
            <Icon name="clock" size={24} /> {v.timeChip}
          </span>
        )}
      </div>

      {v.empty ?? (
        <>
          <div className="relative flex flex-col items-center gap-6 sm:flex-row">
            <InteractiveLoopy size={168} expression={v.theme.expr} colorA={v.theme.a} colorB={v.theme.b} className="shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
              <div className="flex items-center gap-3">
                <MoodIcon value={v.moodKey} size={52} />
                <div>
                  <p className="m-0 font-display text-[26px] font-semibold leading-tight text-ink">{v.moodLabel}</p>
                  {v.sub && <p className="m-0 text-xs font-semibold text-ink-soft">{v.sub}</p>}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                {disp && <Chip><i className="h-2.5 w-2.5 rounded-full" style={{ background: disp.dot }} />{disp.label}</Chip>}
                {v.actividad && <Chip tone="sky">{act && <Icon name={act.icon} bare size={16} />}{v.actividad}</Chip>}
                {loc && <Chip tone="mint"><Icon name={loc.icon} bare size={16} />{loc.label}</Chip>}
                {v.vence && <Chip tone="butter"><Icon name="clock" bare size={16} />hasta {new Date(v.vence).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Chip>}
              </div>
            </div>
          </div>

          {v.mensaje && (
            <div className="relative rounded-[28px] bg-white/75 px-6 py-4">
              <p className="m-0 font-hand text-[28px] leading-tight text-ink">“{v.mensaje}”</p>
            </div>
          )}
          {v.energia !== null && v.energia !== undefined && <div className="relative"><Battery value={v.energia} /></div>}
        </>
      )}
      {v.footer && <div className={`relative mt-auto ${v.locked ? 'pointer-events-none opacity-50 grayscale' : ''}`}>{v.footer}</div>}
    </section>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </div>
  )
}

const pill = (on: boolean) =>
  `inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[13px] font-bold transition-all ${
    on ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'
  }`

const GRAY: Theme = { expr: 'waiting', a: '#CFC9D8', b: '#E6E2EB', card: 'linear-gradient(135deg,#EEECF1,#E1DEE7)', aura: '#CFC9D8' }

/** Tarjeta de "tu pareja todavía no llegó": link de invitación a mano. */
function InvitePartner() {
  const { space } = useAuth()
  const [inv, setInv] = useState<Invitation | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!space) return
    ;(async () => {
      const { data: existing } = await supabase.from('invitations').select('*').eq('space_id', space.id).eq('usado', false)
        .gt('vence_en', new Date().toISOString()).order('creado_en', { ascending: false }).limit(1).maybeSingle()
      if (existing) return setInv(existing as Invitation)
      const { data } = await supabase.rpc('create_invitation', { p_space_id: space.id })
      if (data) setInv(data as Invitation)
    })()
  }, [space])

  const url = inv ? `${window.location.origin}/invite/${inv.token}` : ''
  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative flex flex-col items-center gap-5 py-4 text-center">
      <div className="grayscale"><InteractiveLoopy size={130} expression="waiting" colorA={GRAY.a} colorB={GRAY.b} /></div>
      <div>
        <h3 className="m-0 font-display text-[26px] leading-tight text-ink/80">Tu pareja aún no llegó</h3>
        <p className="m-0 mt-2 max-w-sm text-ink-soft">Mandale la invitación y empiecen a compartir cómo están, ahora mismo.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={copy} disabled={!inv}>
          <Icon name={copied ? 'check' : 'copy'} bare size={20} tone="lavender" />{copied ? '¡Copiado!' : 'Copiar link'}
        </Button>
        {inv && (
          <a href={`https://wa.me/?text=${encodeURIComponent(`Te invito a nuestro Loopy: ${url}`)}`} target="_blank" rel="noreferrer" className="no-underline">
            <Button variant="secondary"><Icon name="whatsapp" bare size={20} tone="mint" />WhatsApp</Button>
          </a>
        )}
      </div>
      {inv && <p className="m-0 text-xs text-ink-muted">Código <b className="tracking-widest text-ink-soft">{inv.codigo}</b> · vence el {new Date(inv.vence_en).toLocaleDateString('es-AR')}</p>}
    </div>
  )
}

export default function Estados() {
  const { space, user } = useAuth()
  const [mine, setMine] = useState<Status | null>(null)
  const [partner, setPartner] = useState<Status | null>(null)
  const [touches, setTouches] = useState<Touch[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPartner, setHasPartner] = useState(true)
  const [, setTick] = useState(0)

  const [emoji, setEmoji] = useState(MOODS[0].key)
  const [disponibilidad, setDisponibilidad] = useState<Disp>('libre')
  const [actTipo, setActTipo] = useState<string | null>(null)
  const [actTxt, setActTxt] = useState('')
  const [ubicacion, setUbicacion] = useState<string | null>(null)
  const [energia, setEnergia] = useState(70)
  const [mensaje, setMensaje] = useState('')
  const [venc, setVenc] = useState('none')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const initialized = useRef(false)

  const formKey = JSON.stringify([emoji, disponibilidad, actTipo, actTxt.trim(), ubicacion, energia, mensaje.trim(), venc])
  const dirty = savedKey !== formKey

  async function load() {
    if (!space || !user) return
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    const [m, p, t, r, mc] = await Promise.all([
      supabase.from('statuses').select('*').eq('space_id', space.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('statuses').select('*').eq('space_id', space.id).neq('user_id', user.id).maybeSingle(),
      supabase.from('thinking_touches').select('*').eq('space_id', space.id).gte('creado_en', since.toISOString()).order('creado_en', { ascending: false }),
      supabase.from('status_reactions').select('*').eq('space_id', space.id).gte('creado_en', since.toISOString()).order('creado_en', { ascending: false }),
      supabase.from('memberships').select('user_id', { count: 'exact', head: true }).eq('space_id', space.id),
    ])
    const s = m.data as Status | null
    setMine(s)
    if (s && !initialized.current) {
      initialized.current = true
      const e = s.emoji ?? MOODS[0].key
      const d = (s.disponibilidad as Disp) ?? 'libre'
      const txt = s.actividad_tipo ? '' : s.actividad ?? ''
      const en = s.energia ?? 70
      setEmoji(e); setDisponibilidad(d); setActTipo(s.actividad_tipo); setActTxt(txt)
      setUbicacion(s.ubicacion); setEnergia(en); setMensaje(s.mensaje ?? '')
      setSavedKey(JSON.stringify([e, d, s.actividad_tipo, txt.trim(), s.ubicacion, en, (s.mensaje ?? '').trim(), 'none']))
    }
    setPartner(p.data as Status | null)
    setHasPartner((mc.count ?? 2) >= 2)
    setTouches((t.data as Touch[]) ?? [])
    setReactions((r.data as Reaction[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [space, user])

  useEffect(() => {
    if (!space) return
    const filter = `space_id=eq.${space.id}`
    const channel = supabase
      .channel(`estados-${space.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses', filter }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'thinking_touches', filter }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'status_reactions', filter }, () => load())
      .subscribe()
    const clock = setInterval(() => setTick((n) => n + 1), 30000)
    return () => { supabase.removeChannel(channel); clearInterval(clock) }
  }, [space, user])

  function toast(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 1800)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user) return
    setSaving(true)
    setError(null)
    const actLabel = actTipo ? ACTIVIDADES.find((a) => a.key === actTipo)?.label ?? null : actTxt.trim() || null
    const { data: saved, error: upsertError } = await supabase.from('statuses').upsert(
      {
        space_id: space.id, user_id: user.id, emoji,
        actividad: actLabel, actividad_tipo: actTipo, disponibilidad,
        ubicacion, energia, mensaje: mensaje.trim() || null,
        vence_en: venceDesde(venc), zona_horaria: myTimezone(),
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'space_id,user_id' },
    ).select('id').single()
    if (!upsertError) {
      if (saved && (mine?.emoji !== emoji || (mine?.mensaje ?? null) !== (mensaje.trim() || null))) notifyPartner('status', saved.id)
      const t = new Date()
      t.setMinutes(t.getMinutes() - t.getTimezoneOffset())
      await supabase.from('mood_logs').upsert(
        { space_id: space.id, user_id: user.id, fecha: t.toISOString().slice(0, 10), mood: emoji },
        { onConflict: 'space_id,user_id,fecha' },
      )
    }
    setSaving(false)
    if (upsertError) {
      setError('Uy, se nos enredó el hilo. Probá de nuevo.')
      return
    }
    setSavedKey(formKey)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
    load()
  }

  async function sendTouch(text: string) {
    if (!space || !user) return
    const { data: row } = await supabase.from('thinking_touches').insert({ space_id: space.id, user_id: user.id, mensaje: text }).select('id').single()
    if (row) notifyPartner('touch', row.id)
    toast('Enviado')
    load()
  }
  async function react(tipo: string) {
    if (!space || !user) return
    const { data: row } = await supabase.from('status_reactions').insert({ space_id: space.id, user_id: user.id, tipo }).select('id').single()
    if (row) notifyPartner('reaction', row.id)
    toast('Enviado')
    load()
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><LoopyMascot /></div>
  }

  const p = effective(partner)
  const pTheme = themeFor(p?.mood)
  const myTheme = themeFor(emoji)
  const myActLabel = actTipo ? ACTIVIDADES.find((a) => a.key === actTipo)?.label ?? null : actTxt.trim() || null
  const myTz = myTimezone()

  const feed = [
    ...touches.map((t) => ({ id: t.id, mine: t.user_id === user?.id, at: t.creado_en, icon: 'heart' as const, text: t.mensaje ?? 'Pensando en vos' })),
    ...reactions.map((r) => {
      const meta = REACCIONES.find((x) => x.key === r.tipo)
      return { id: r.id, mine: r.user_id === user?.id, at: r.creado_en, icon: (meta?.icon ?? 'heart') as 'heart', text: meta?.label ?? r.tipo }
    }),
  ].sort((a, b) => (a.at < b.at ? 1 : -1))

  const sendPanel = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2.5">
        {REACCIONES.map((r) => (
          <button
            key={r.key} type="button" onClick={() => react(r.key)}
            className="flex flex-col items-center gap-1.5 rounded-[24px] bg-white/70 py-3 text-[11px] font-bold text-ink transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:bg-white active:scale-90"
          >
            <Icon name={r.icon} size={42} />{r.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {FRASES.map((f) => (
          <button type="button" key={f} onClick={() => sendTouch(f)} className="rounded-full bg-white/80 px-3.5 py-1.5 text-[13px] font-bold text-[#C2467A] transition-transform hover:scale-105 active:scale-90">
            {f}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Page>
      <MoodAura mine={emoji} partner={hasPartner ? p?.mood ?? null : null} />
      <PageHeader icon="estados" title="Estados" subtitle="Cómo está cada uno, ahora mismo." />

      {/* ── Escenario: ella/él | vos ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatusView
          eyebrow="Tu pareja"
          theme={hasPartner ? pTheme : GRAY}
          locked={!hasPartner}
          moodKey={p?.mood ?? null}
          moodLabel={p ? (p.asleep ? 'Durmiendo' : MOODS.find((m) => m.key === p.emoji)?.label ?? 'Sin ánimo') : ''}
          sub={p ? `Actualizó ${timeAgo(p.actualizado_en)}` : undefined}
          timeChip={p?.zona_horaria ? `${localTime(p.zona_horaria)}${cityOf(p.zona_horaria) ? ` · ${cityOf(p.zona_horaria)}` : ''}` : undefined}
          disp={p?.disponibilidad}
          actividad={p?.actividad}
          actividadTipo={p?.actividad_tipo}
          ubicacion={p?.ubicacion}
          vence={p && !p.expired ? p.vence_en : null}
          mensaje={p?.mensaje}
          energia={p?.energia}
          empty={!hasPartner ? <InvitePartner /> : !p ? (
            <div className="relative flex items-center gap-6 py-2">
              <InteractiveLoopy size={140} expression="waiting" className="shrink-0" />
              <p className="m-0 text-ink/70">Todavía no actualizó su estado. Mientras tanto, mandale un toque.</p>
            </div>
          ) : undefined}
          footer={
            <div className="flex flex-col gap-3">
              <Eyebrow>Mandale algo</Eyebrow>
              {sendPanel}
            </div>
          }
        />

        <StatusView
          eyebrow="Así te ve tu pareja"
          theme={myTheme}
          moodKey={emoji}
          moodLabel={MOODS.find((m) => m.key === emoji)?.label ?? ''}
          sub={mine ? `Guardado ${timeAgo(mine.actualizado_en)}` : 'Sin guardar todavía'}
          timeChip={`${localTime(myTz)}${cityOf(myTz) ? ` · ${cityOf(myTz)}` : ''}`}
          disp={disponibilidad}
          actividad={myActLabel}
          actividadTipo={actTipo}
          ubicacion={ubicacion}
          mensaje={mensaje.trim() || null}
          energia={energia}
          footer={
            <div className="flex items-center gap-3">
              <Button type="submit" form="estado-form" disabled={saving || (!dirty && !!mine)} className="flex-1">
                {saving ? 'Actualizando…' : justSaved ? '¡Listo!' : dirty ? 'Guardar mi estado' : 'Todo al día'}
              </Button>
              {dirty && <span className="whitespace-nowrap text-xs font-bold text-ink-soft"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-coral" />Sin guardar</span>}
            </div>
          }
        />
      </div>

      {/* ── Editor ── */}
      <form id="estado-form" onSubmit={handleSubmit} className="card mt-6 !p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Icon name="edit" size={40} />
            <div>
              <h2 className="m-0 text-xl text-ink">Editar mi estado</h2>
              <p className="m-0 text-[13px] text-ink-soft">Mirá la vista previa de arriba mientras cambiás cosas.</p>
            </div>
          </div>
          {error && <p className="m-0 text-sm text-error">{error}</p>}
        </div>

        <div className="grid grid-cols-1 gap-8 p-6 md:p-8 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-line [&>*]:lg:px-8 [&>*:first-child]:lg:pl-0 [&>*:last-child]:lg:pr-0">
          <div className="flex flex-col gap-7">
            <Section title="Cómo estás">
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map((m) => (
                  <button
                    type="button" key={m.key} onClick={() => setEmoji(m.key)}
                    className={`flex flex-col items-center gap-1 rounded-[22px] px-1 py-2 text-[11px] font-bold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      emoji === m.key ? 'scale-105 bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'text-ink-soft hover:bg-surface-soft'
                    }`}
                  >
                    <Icon name={m.icon} tone={m.tone} size={42} />{m.label}
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Disponibilidad">
              <div className="flex flex-wrap gap-2">
                {DISPONIBILIDAD.map((d) => (
                  <button
                    type="button" key={d.key} onClick={() => setDisponibilidad(d.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                      disponibilidad === d.key ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'
                    }`}
                  >
                    <i className="h-2.5 w-2.5 rounded-full" style={{ background: d.dot }} />{d.label}
                  </button>
                ))}
              </div>
            </Section>
          </div>

          <div className="flex flex-col gap-7">
            <Section title="Qué estás haciendo">
              <div className="flex flex-wrap gap-2">
                {ACTIVIDADES.map((a) => (
                  <button type="button" key={a.key} onClick={() => { setActTipo(actTipo === a.key ? null : a.key); setActTxt('') }} className={pill(actTipo === a.key)}>
                    <Icon name={a.icon} size={28} />{a.label}
                  </button>
                ))}
              </div>
              <input value={actTxt} onChange={(e) => { setActTxt(e.target.value); if (e.target.value) setActTipo(null) }} placeholder="…o escribí otra cosa" className="field" />
            </Section>
            <Section title="Dónde estás">
              <div className="flex flex-wrap gap-2">
                {UBICACIONES.map((u) => (
                  <button type="button" key={u.key} onClick={() => setUbicacion(ubicacion === u.key ? null : u.key)} className={pill(ubicacion === u.key)}>
                    <Icon name={u.icon} size={28} />{u.label}
                  </button>
                ))}
              </div>
            </Section>
          </div>

          <div className="flex flex-col gap-7">
            <Section title={`Batería social · ${energyLabel(energia)}`}>
              <div className="rounded-full bg-surface-soft px-4 py-3.5">
                <input type="range" min={0} max={100} step={5} value={energia} onChange={(e) => setEnergia(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-[#7C5CDB]" aria-label="Batería social" />
              </div>
            </Section>
            <Section title="Mensaje">
              <input value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Algo corto para tu pareja" className="field" maxLength={120} />
            </Section>
            <Section title="Este estado dura">
              <div className="flex flex-wrap gap-2">
                {VENCIMIENTOS.map((v) => (
                  <button
                    type="button" key={v.key} onClick={() => setVenc(v.key)}
                    className={`rounded-full px-4 py-2 text-[13px] font-bold transition-all ${venc === v.key ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </form>

      {/* ── Historia ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5"><Icon name="heart" size={32} /><Eyebrow>Hoy entre ustedes</Eyebrow></div>
            <Chip tone="blush">{feed.length} {feed.length === 1 ? 'toque' : 'toques'}</Chip>
          </div>
          {feed.length === 0 ? (
            <p className="m-0 py-10 text-center text-sm text-ink-soft">Todavía no hay toques hoy. ¿Arrancás vos?</p>
          ) : (
            <ul className="m-0 flex max-h-[340px] list-none flex-col gap-2 overflow-y-auto p-0">
              {feed.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-full bg-surface-soft py-1.5 pl-1.5 pr-4">
                  <Icon name={f.icon} size={36} />
                  <p className="m-0 min-w-0 flex-1 truncate text-sm font-bold text-ink">
                    <span className={f.mine ? 'text-plum' : 'text-[#F2733F]'}>{f.mine ? 'Vos' : 'Tu pareja'}</span> · {f.text}
                  </p>
                  <span className="text-xs text-ink-muted">{new Date(f.at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <WeekMoods className="lg:col-span-3" />
      </div>

      {flash && (
        <div className="animate-pop fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-loopy-lg)] md:bottom-8">
          {flash}
        </div>
      )}
    </Page>
  )
}
