import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Icon, MOODS, MoodIcon } from '../../components/ui/Icon'
import { Page, PageHeader, Chip } from '../../components/ui/PageShell'
import type { Status } from '../../types/db'

type Disp = NonNullable<Status['disponibilidad']>
const DISPONIBILIDAD: { key: Disp; label: string; dot: string }[] = [
  { key: 'libre', label: 'Libre', dot: '#2FAE7F' },
  { key: 'ocupado', label: 'Ocupado', dot: '#F2733F' },
  { key: 'no_molestar', label: 'No molestar', dot: '#E5586F' },
]

export default function Estados() {
  const { space, user } = useAuth()
  const [mine, setMine] = useState<Status | null>(null)
  const [partner, setPartner] = useState<Status | null>(null)
  const [emoji, setEmoji] = useState(MOODS[0].key)
  const [actividad, setActividad] = useState('')
  const [disponibilidad, setDisponibilidad] = useState<Disp>('libre')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  async function load() {
    if (!space || !user) return
    const { data: mineData } = await supabase.from('statuses').select('*').eq('space_id', space.id).eq('user_id', user.id).maybeSingle()
    const { data: partnerData } = await supabase.from('statuses').select('*').eq('space_id', space.id).neq('user_id', user.id).maybeSingle()

    if (mineData) {
      const s = mineData as Status
      setMine(s)
      setEmoji(s.emoji ?? MOODS[0].key)
      setActividad(s.actividad ?? '')
      setDisponibilidad((s.disponibilidad as Disp) ?? 'libre')
      setMensaje(s.mensaje ?? '')
    }
    setPartner(partnerData as Status | null)
    setLoading(false)
  }

  useEffect(() => { load() }, [space, user])

  useEffect(() => {
    if (!space) return
    const channel = supabase
      .channel(`statuses-${space.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses', filter: `space_id=eq.${space.id}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [space, user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user) return
    setSaving(true)
    setError(null)
    const { error: upsertError } = await supabase.from('statuses').upsert(
      {
        space_id: space.id, user_id: user.id, emoji,
        actividad: actividad || null, disponibilidad, mensaje: mensaje || null,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'space_id,user_id' },
    )
    if (!upsertError) {
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
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
    load()
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><LoopyMascot /></div>
  }

  const pDisp = DISPONIBILIDAD.find((d) => d.key === partner?.disponibilidad)

  return (
    <Page>
      <PageHeader icon="estados" title="Estados" subtitle="Cómo está cada uno, ahora mismo." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <div className="card relative overflow-hidden bg-grad-loop">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
          <p className="eyebrow relative m-0">Tu pareja</p>
          {partner ? (
            <div className="relative mt-3 flex flex-col gap-3">
              <MoodIcon value={partner.emoji} size={72} />
              {pDisp && (
                <Chip tone="lavender">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: pDisp.dot }} />
                  {pDisp.label}
                </Chip>
              )}
              {partner.actividad && <p className="m-0 font-semibold text-ink">{partner.actividad}</p>}
              {partner.mensaje && <p className="m-0 font-hand text-2xl leading-tight text-ink">“{partner.mensaje}”</p>}
            </div>
          ) : (
            <div className="relative mt-3 flex flex-col items-center gap-2 py-4 text-center">
              <LoopyMascot size={84} expression="waiting" />
              <p className="m-0 text-ink/70">Todavía no actualizó su estado.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <p className="eyebrow m-0">
            Tu estado
            {mine && (
              <span className="ml-2 normal-case tracking-normal text-ink-muted">
                · {new Date(mine.actualizado_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>

          <div className="grid grid-cols-4 gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.key}
                onClick={() => setEmoji(m.key)}
                className={`flex flex-col items-center gap-1 rounded-[24px] px-1 py-2 text-[11px] font-bold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  emoji === m.key ? 'scale-105 bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'text-ink-soft hover:bg-surface-soft'
                }`}
              >
                <Icon name={m.icon} tone={m.tone} size={44} />
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {DISPONIBILIDAD.map((d) => (
              <button
                type="button"
                key={d.key}
                onClick={() => setDisponibilidad(d.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  disponibilidad === d.key ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft'
                }`}
              >
                <i className="h-2.5 w-2.5 rounded-full" style={{ background: d.dot }} />
                {d.label}
              </button>
            ))}
          </div>

          <input value={actividad} onChange={(e) => setActividad(e.target.value)} placeholder="¿Qué estás haciendo?" className="field" />
          <input value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Mensaje corto (opcional)" className="field" />
          {error && <p className="m-0 text-sm text-error">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? 'Actualizando…' : justSaved ? '¡Listo!' : 'Actualizar mi estado'}
          </Button>
        </form>
      </div>
    </Page>
  )
}
