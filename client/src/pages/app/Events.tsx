import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { LoopyMascot } from '../../components/LoopyMascot'
import type { Event } from '../../types/db'

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Events() {
  const { space, user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [titulo, setTitulo] = useState('')
  const [inicio, setInicio] = useState('')
  const [tipo, setTipo] = useState('general')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space) return
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('space_id', space.id)
      .gte('inicio', new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString())
      .order('inicio', { ascending: true })
    setEvents((data as Event[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim() || !inicio) return
    await supabase.from('events').insert({
      space_id: space.id,
      creado_por: user.id,
      titulo,
      inicio: new Date(inicio).toISOString(),
      tipo,
    })
    setTitulo('')
    setInicio('')
    setOpen(false)
    load()
  }

  const next = events[0]

  return (
    <div className="mx-auto max-w-[800px] p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Calendario de eventos</h1>
        <Button variant="primary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cancelar' : '+ Agregar'}
        </Button>
      </div>

      {next && (
        <div className="mt-6 rounded-[var(--radius-lg)] bg-grad-dream p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/70">Próximo</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">{next.titulo}</p>
          <p className="text-ink/80">
            {new Date(next.inicio).toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            {' · '}
            {daysUntil(next.inicio) === 0 ? '¡Hoy!' : `en ${daysUntil(next.inicio)} días`}
          </p>
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
            placeholder="¿Qué van a hacer?"
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <input
            required
            type="datetime-local"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 capitalize outline-none focus:ring-2 focus:ring-lavender"
          >
            {['general', 'cita', 'aniversario', 'viaje', 'cumpleaños'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary">
            Agendar
          </Button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {!loading && events.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <LoopyMascot expression="thinking" />
            <p className="text-ink-soft">Nada agendado todavía.</p>
          </div>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-line bg-surface p-4"
          >
            <div>
              <p className="font-semibold text-ink">{event.titulo}</p>
              <p className="text-sm text-ink-soft capitalize">
                {new Date(event.inicio).toLocaleString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' · '}
                {event.tipo}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
