import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Icon, MoodIcon } from '../ui/Icon'
import { THREAD_COLORS, DEFAULT_THREAD_COLOR } from '../../lib/threadColors'
import type { MoodLog } from '../../types/db'

function localISO(d: Date) {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 10)
}

export function WeekMoods() {
  const { space, user, profile } = useAuth()
  const [logs, setLogs] = useState<MoodLog[]>([])

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const from = localISO(days[0])
  const todayISO = localISO(new Date())

  async function load() {
    if (!space) return
    const { data } = await supabase.from('mood_logs').select('*').eq('space_id', space.id).gte('fecha', from)
    setLogs((data as MoodLog[]) ?? [])
  }

  useEffect(() => {
    load()
    if (!space) return
    const channel = supabase
      .channel(`moods-${space.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_logs', filter: `space_id=eq.${space.id}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [space])

  const find = (fecha: string, mine: boolean) =>
    logs.find((l) => l.fecha === fecha && (mine ? l.user_id === user?.id : l.user_id !== user?.id))

  const myColor = THREAD_COLORS[profile?.color_hilo ?? ''] ?? DEFAULT_THREAD_COLOR

  return (
    <section className="card col-span-2 bg-[#F3EEFF]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Icon name="estados" size={32} />
          <span className="eyebrow">Su semana, en ánimos</span>
        </div>
        <div className="flex gap-3 text-xs font-bold text-ink-soft">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: myColor }} />Vos</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-peach" />Tu pareja</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 md:gap-2">
        {days.map((d) => {
          const fecha = localISO(d)
          const a = find(fecha, true)
          const b = find(fecha, false)
          return (
            <div key={fecha} className={`flex flex-col items-center gap-1.5 rounded-[22px] py-2 ${fecha === todayISO ? 'bg-white shadow-[var(--shadow-loopy-md)]' : 'bg-white/60'}`}>
              <span className="text-[11px] font-bold capitalize text-ink-soft">
                {d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '').slice(0, 3)}
              </span>
              {a ? <MoodIcon value={a.mood} size={30} /> : <span className="grid h-[30px] w-[30px] place-items-center text-ink-muted">·</span>}
              {b ? <MoodIcon value={b.mood} size={30} /> : <span className="grid h-[30px] w-[30px] place-items-center text-ink-muted">·</span>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
