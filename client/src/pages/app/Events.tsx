import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Page, PageHeader, EmptyState, IconBtn, FormCard, Chip } from '../../components/ui/PageShell'
import type { Event } from '../../types/db'

const TIPOS: { key: string; icon: IconName }[] = [
  { key: 'general', icon: 'star' },
  { key: 'cita', icon: 'heart' },
  { key: 'aniversario', icon: 'cake' },
  { key: 'viaje', icon: 'plane' },
  { key: 'cumpleaños', icon: 'gift' },
]
const tipoIcon = (t: string | null): IconName => TIPOS.find((x) => x.key === t)?.icon ?? 'star'

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

export default function Events() {
  const { space, user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [titulo, setTitulo] = useState('')
  const [inicio, setInicio] = useState('')
  const [tipo, setTipo] = useState('general')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!space) return
    const { data } = await supabase.from('events').select('*').eq('space_id', space.id)
      .gte('inicio', new Date(Date.now() - 86400000).toISOString()).order('inicio', { ascending: true })
    setEvents((data as Event[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [space])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !titulo.trim() || !inicio) return
    if (editingId) {
      await supabase.from('events').update({ titulo, inicio: new Date(inicio).toISOString(), tipo }).eq('id', editingId)
    } else {
      await supabase.from('events').insert({ space_id: space.id, creado_por: user.id, titulo, inicio: new Date(inicio).toISOString(), tipo })
    }
    cancel()
    load()
  }

  function toDatetimeLocal(iso: string) {
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }
  function startEdit(event: Event) {
    setEditingId(event.id); setTitulo(event.titulo); setInicio(toDatetimeLocal(event.inicio)); setTipo(event.tipo ?? 'general'); setOpen(true)
  }
  function cancel() { setOpen(false); setEditingId(null); setTitulo(''); setInicio(''); setTipo('general') }
  async function handleDelete(id: string) { await supabase.from('events').delete().eq('id', id); load() }

  const next = events[0]

  return (
    <Page>
      <PageHeader
        icon="calendario"
        title="Calendario"
        subtitle="Citas, viajes y fechas que importan."
        action={
          <Button onClick={() => (open ? cancel() : setOpen(true))} variant={open ? 'secondary' : 'primary'}>
            <Icon name={open ? 'close' : 'plus'} bare size={20} tone="lavender" />
            {open ? 'Cancelar' : 'Agregar'}
          </Button>
        }
      />

      {open && (
        <FormCard onSubmit={handleSubmit}>
          <input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="¿Qué van a hacer?" className="field" />
          <input required type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className="field" />
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button
                type="button" key={t.key} onClick={() => setTipo(t.key)}
                className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold capitalize transition-all ${
                  tipo === t.key ? 'bg-lilac-mist text-plum shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft'
                }`}
              >
                <Icon name={t.icon} size={30} />{t.key}
              </button>
            ))}
          </div>
          <Button type="submit">{editingId ? 'Guardar cambios' : 'Agendar'}</Button>
        </FormCard>
      )}

      {next && (
        <div className="card relative mb-6 overflow-hidden bg-grad-dream">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
          <p className="eyebrow relative m-0">Próximo</p>
          <p className="relative m-0 mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">{next.titulo}</p>
          <div className="relative mt-3 flex flex-wrap items-center gap-2">
            <Chip tone="sky">
              {new Date(next.inicio).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Chip>
            <Chip tone="lavender">{daysUntil(next.inicio) <= 0 ? '¡Hoy!' : `en ${daysUntil(next.inicio)} días`}</Chip>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        {!loading && events.length === 0 && <EmptyState text="Nada agendado todavía. ¿Planeamos algo?" />}
        {events.map((event) => {
          const d = new Date(event.inicio)
          return (
            <div key={event.id} className="card card-lift flex items-center gap-3 !p-4 md:gap-4">
              <div className="w-[58px] shrink-0 rounded-[20px] bg-[#EAF4FF] py-2 text-center">
                <div className="text-[11px] font-extrabold uppercase text-coral">{d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</div>
                <div className="font-display text-2xl font-semibold leading-none">{d.getDate()}</div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate font-bold text-ink">{event.titulo}</p>
                <p className="m-0 flex items-center gap-1.5 text-[13px] capitalize text-ink-soft">
                  <Icon name={tipoIcon(event.tipo)} size={20} bare />
                  {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {event.tipo}
                </p>
              </div>
              <div className="flex gap-2">
                <IconBtn icon="edit" label="Editar" onClick={() => startEdit(event)} />
                <IconBtn icon="trash" label="Eliminar" danger onClick={() => handleDelete(event.id)} />
              </div>
            </div>
          )
        })}
      </div>
    </Page>
  )
}
