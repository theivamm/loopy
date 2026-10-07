import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import type { Status } from '../../types/db'

const EMOJIS = ['😊', '🥰', '😴', '😅', '😤', '🤒', '🥳', '😌']
const DISPONIBILIDAD: { key: NonNullable<Status['disponibilidad']>; label: string }[] = [
  { key: 'libre', label: 'Libre' },
  { key: 'ocupado', label: 'Ocupado' },
  { key: 'no_molestar', label: 'No molestar' },
]

export default function Estados() {
  const { space, user } = useAuth()
  const [mine, setMine] = useState<Status | null>(null)
  const [partner, setPartner] = useState<Status | null>(null)
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [actividad, setActividad] = useState('')
  const [disponibilidad, setDisponibilidad] = useState<NonNullable<Status['disponibilidad']>>('libre')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  async function load() {
    if (!space || !user) return
    const { data: mineData } = await supabase
      .from('statuses')
      .select('*')
      .eq('space_id', space.id)
      .eq('user_id', user.id)
      .maybeSingle()
    const { data: partnerData } = await supabase
      .from('statuses')
      .select('*')
      .eq('space_id', space.id)
      .neq('user_id', user.id)
      .maybeSingle()

    if (mineData) {
      const s = mineData as Status
      setMine(s)
      setEmoji(s.emoji ?? EMOJIS[0])
      setActividad(s.actividad ?? '')
      setDisponibilidad((s.disponibilidad as NonNullable<Status['disponibilidad']>) ?? 'libre')
      setMensaje(s.mensaje ?? '')
    }
    setPartner(partnerData as Status | null)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [space, user])

  // Live-sync: without this, a status change from one partner only shows up
  // for the other after a manual reload.
  useEffect(() => {
    if (!space) return
    const channel = supabase
      .channel(`statuses-${space.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'statuses', filter: `space_id=eq.${space.id}` },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [space, user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user) return
    setSaving(true)
    setError(null)
    const { error: upsertError } = await supabase.from('statuses').upsert(
      {
        space_id: space.id,
        user_id: user.id,
        emoji,
        actividad: actividad || null,
        disponibilidad,
        mensaje: mensaje || null,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'space_id,user_id' },
    )
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
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoopyMascot />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[800px] p-6 md:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Estados</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] bg-grad-loop p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/70">Tu pareja</p>
          {partner ? (
            <>
              <p className="mt-2 text-4xl">{partner.emoji ?? '🙂'}</p>
              <p className="mt-1 font-semibold text-ink">
                {DISPONIBILIDAD.find((d) => d.key === partner.disponibilidad)?.label ?? 'Sin estado'}
              </p>
              {partner.actividad && <p className="text-ink/80">{partner.actividad}</p>}
              {partner.mensaje && <p className="mt-2 font-hand text-lg text-ink">{partner.mensaje}</p>}
            </>
          ) : (
            <p className="mt-2 text-ink/70">Todavía no actualizó su estado.</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface p-5 shadow-[var(--shadow-loopy-sm)]"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Tu estado
            {mine && (
              <span className="ml-2 normal-case text-ink-muted">
                · actualizado {new Date(mine.actualizado_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEmoji(e)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-transform ${
                  emoji === e ? 'scale-110 bg-lilac-mist' : 'hover:bg-surface-soft'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <select
            value={disponibilidad}
            onChange={(e) => setDisponibilidad(e.target.value as typeof disponibilidad)}
            className="h-11 rounded-[var(--radius-sm)] bg-surface-soft px-3 outline-none focus:ring-2 focus:ring-lavender"
          >
            {DISPONIBILIDAD.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
          <input
            value={actividad}
            onChange={(e) => setActividad(e.target.value)}
            placeholder="¿Qué estás haciendo?"
            className="h-11 rounded-[var(--radius-sm)] bg-surface-soft px-3 outline-none focus:ring-2 focus:ring-lavender"
          />
          <input
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Mensaje corto (opcional)"
            className="h-11 rounded-[var(--radius-sm)] bg-surface-soft px-3 outline-none focus:ring-2 focus:ring-lavender"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Actualizando…' : justSaved ? '¡Listo! 🎉' : 'Actualizar mi estado'}
          </Button>
        </form>
      </div>
    </div>
  )
}
