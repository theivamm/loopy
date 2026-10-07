import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { BentoCard } from '../../components/ui/BentoCard'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Button } from '../../components/ui/Button'
import type { Letter, Status } from '../../types/db'

function daysTogether(fecha: string | null) {
  if (!fecha) return null
  const start = new Date(fecha)
  const diff = Date.now() - start.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default function Dashboard() {
  const { user, profile, space } = useAuth()
  const [partnerStatus, setPartnerStatus] = useState<Status | null>(null)
  const [lastLetter, setLastLetter] = useState<Letter | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!space || !user) return

    function loadPartnerStatus() {
      if (!space || !user) return
      supabase
        .from('statuses')
        .select('*')
        .eq('space_id', space.id)
        .neq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setPartnerStatus(data as Status | null))
    }

    loadPartnerStatus()

    supabase
      .from('letters')
      .select('*')
      .eq('space_id', space.id)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLastLetter(data as Letter | null))

    // keeps "pensando en vos" / partner status live without a manual reload
    const channel = supabase
      .channel(`dashboard-statuses-${space.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'statuses', filter: `space_id=eq.${space.id}` },
        loadPartnerStatus,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [space, user])

  async function sendThinkingOfYou() {
    if (!space || !user) return
    setSending(true)
    await supabase.from('statuses').upsert(
      {
        space_id: space.id,
        user_id: user.id,
        mensaje: 'Pensando en vos 💭',
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'space_id,user_id' },
    )
    setSending(false)
  }

  const days = daysTogether(space?.fecha_aniversario ?? null)

  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Hola{profile?.apodo ? `, ${profile.apodo}` : ''} 👋
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
        <BentoCard gradient="loop" className="col-span-2 row-span-2 flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-ink/70">{space?.nombre}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {partnerStatus?.mensaje ?? 'Todavía no hay novedades de tu pareja hoy.'}
            </h2>
          </div>
          <div className="flex items-end justify-between">
            <LoopyMascot size={88} expression={partnerStatus ? 'loving' : 'waiting'} />
            <Button variant="primary-soft" onClick={sendThinkingOfYou} disabled={sending}>
              💭 {sending ? 'Enviando…' : 'Pensando en vos'}
            </Button>
          </div>
        </BentoCard>

        <BentoCard className="col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Juntos hace</p>
          <p className="mt-1 font-display text-3xl font-semibold text-plum">
            {days !== null ? days : '—'}
          </p>
          <p className="text-sm text-ink-soft">días</p>
        </BentoCard>

        <Link to="/app/cartas" className="col-span-1">
          <BentoCard className="h-full bg-[#FFEEF4]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">💌 Última carta</p>
            <p className="mt-1 line-clamp-2 font-hand text-xl text-ink">
              {lastLetter ? lastLetter.titulo : 'Todavía no hay cartas.'}
            </p>
          </BentoCard>
        </Link>

        <Link to="/app/musica" className="col-span-1">
          <BentoCard className="h-full bg-[#F3EEFF]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">🎵 Canción del día</p>
            <p className="mt-1 text-ink-soft">Todavía no eligieron una.</p>
          </BentoCard>
        </Link>

        <Link to="/app/pelis" className="col-span-1">
          <BentoCard className="h-full bg-[#EDF6FF]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">🎬 Para ver hoy</p>
            <p className="mt-1 text-ink-soft">¿Qué vemos hoy?</p>
          </BentoCard>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/app/calendario">
          <BentoCard className="h-full bg-[#EDF6FF]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">📅 Próximo evento</p>
            <p className="mt-1 text-ink-soft">Nada agendado todavía.</p>
          </BentoCard>
        </Link>
        <Link to="/app/comidas">
          <BentoCard className="h-full bg-[#EAF8F2]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">🍝 Hoy cenamos</p>
            <p className="mt-1 text-ink-soft">Sin definir todavía.</p>
          </BentoCard>
        </Link>
        <Link to="/app/notitas">
          <BentoCard className="h-full bg-[#FFF8E1]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">🗒️ Notitas</p>
            <p className="mt-1 text-ink-soft">Dejale una notita a tu pareja.</p>
          </BentoCard>
        </Link>
      </div>
    </div>
  )
}
