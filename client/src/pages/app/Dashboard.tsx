import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Button } from '../../components/ui/Button'
import { Icon, MoodIcon, type IconName } from '../../components/ui/Icon'
import { Chip } from '../../components/ui/PageShell'
import { WeekMoods } from '../../components/home/WeekMoods'
import { DailyQuestion } from '../../components/home/DailyQuestion'
import type { Event, Letter, Note, Song, Status } from '../../types/db'

const MILESTONES = [30, 100, 200, 365, 500, 730, 1000, 1500, 2000, 3000, 5000]
const DISP: Record<string, string> = { libre: 'Libre', ocupado: 'Ocupado', no_molestar: 'No molestar' }
const NOTE_BG: Record<string, string> = { butter: '#FFE8A3', blush: '#FFC9DB', mint: '#C8F0DF', sky: '#C6E0FF' }

function daysTogether(fecha: string | null) {
  if (!fecha) return null
  return Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000))
}
function localISO(d = new Date()) {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 10)
}
function greeting() {
  const h = new Date().getHours()
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
}

function Eyebrow({ icon, children }: { icon: IconName; children: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={32} />
      <span className="eyebrow">{children}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user, profile, space } = useAuth()
  const [partnerStatus, setPartnerStatus] = useState<Status | null>(null)
  const [lastLetter, setLastLetter] = useState<Letter | null>(null)
  const [song, setSong] = useState<Song | null>(null)
  const [nextEvent, setNextEvent] = useState<Event | null>(null)
  const [dinner, setDinner] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [pending, setPending] = useState(0)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!space || !user) return

    function loadPartnerStatus() {
      if (!space || !user) return
      supabase.from('statuses').select('*').eq('space_id', space.id).neq('user_id', user.id).maybeSingle()
        .then(({ data }) => setPartnerStatus(data as Status | null))
    }
    loadPartnerStatus()

    supabase.from('letters').select('*').eq('space_id', space.id).order('creado_en', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setLastLetter(data as Letter | null))
    supabase.from('songs').select('*').eq('space_id', space.id).eq('es_del_dia', true).limit(1).maybeSingle()
      .then(({ data }) => setSong(data as Song | null))
    supabase.from('events').select('*').eq('space_id', space.id).gte('inicio', new Date().toISOString()).order('inicio', { ascending: true }).limit(1).maybeSingle()
      .then(({ data }) => setNextEvent(data as Event | null))
    supabase.from('notes').select('*').eq('space_id', space.id).order('creado_en', { ascending: false }).limit(3)
      .then(({ data }) => setNotes((data as Note[]) ?? []))
    supabase.from('movies').select('id', { count: 'exact', head: true }).eq('space_id', space.id).eq('estado', 'por_ver')
      .then(({ count }) => setPending(count ?? 0))
    supabase.from('meals').select('receta_id').eq('space_id', space.id).eq('fecha', localISO()).eq('momento', 'cena').maybeSingle()
      .then(async ({ data }) => {
        if (!data?.receta_id) return
        const { data: r } = await supabase.from('recipes').select('nombre').eq('id', data.receta_id).maybeSingle()
        setDinner(r?.nombre ?? null)
      })

    const channel = supabase
      .channel(`dashboard-statuses-${space.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses', filter: `space_id=eq.${space.id}` }, loadPartnerStatus)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [space, user])

  async function sendThinkingOfYou() {
    if (!space || !user) return
    setSending(true)
    await supabase.from('statuses').upsert(
      { space_id: space.id, user_id: user.id, mensaje: 'Pensando en vos', actualizado_en: new Date().toISOString() },
      { onConflict: 'space_id,user_id' },
    )
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 2400)
  }

  const days = daysTogether(space?.fecha_aniversario ?? null)
  const nextMilestone = days === null ? null : MILESTONES.find((m) => m > days) ?? Math.ceil((days + 1) / 365) * 365
  const prevMilestone = days === null ? 0 : [...MILESTONES, 0].filter((m) => m <= days).sort((a, b) => b - a)[0] ?? 0
  const progress = days === null || nextMilestone === null ? 0 : (days - prevMilestone) / (nextMilestone - prevMilestone)
  const C = 276.46
  const evDays = nextEvent ? Math.ceil((new Date(nextEvent.inicio).getTime() - Date.now()) / 86400000) : null
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-8 md:px-8">
      <header className="mb-5">
        <p className="eyebrow m-0 capitalize text-ink-muted">{today}</p>
        <h1 className="m-0 mt-1 text-[28px] leading-tight text-ink md:text-4xl">
          {greeting()}{profile?.apodo ? `, ${profile.apodo}` : ''}
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {/* HERO */}
        <section className="relative col-span-2 flex flex-col-reverse items-center justify-between gap-4 overflow-hidden rounded-[40px] bg-grad-loop p-6 shadow-[0_20px_50px_rgba(124,92,219,.18),inset_0_3px_0_rgba(255,255,255,.7)] sm:flex-row sm:items-center md:p-8 md:min-h-[300px]">
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-52 w-52 rounded-full bg-blush/60 blur-3xl" />
          <div className="relative flex w-full flex-1 flex-col gap-3 sm:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              {partnerStatus ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 py-1 pl-1 pr-3.5 text-[13px] font-bold">
                  <MoodIcon value={partnerStatus.emoji} size={28} />
                  {DISP[partnerStatus.disponibilidad ?? ''] ?? 'Sin estado'}
                  {partnerStatus.actividad ? ` · ${partnerStatus.actividad}` : ''}
                </span>
              ) : (
                <span className="rounded-full bg-white/70 px-3.5 py-1.5 text-[13px] font-bold">{space?.nombre}</span>
              )}
            </div>
            <h2 className="m-0 text-balance text-[26px] leading-[1.15] text-ink md:text-[34px]">
              {partnerStatus?.mensaje ?? 'Todavía no hay novedades de tu pareja hoy.'}
            </h2>
            <div className="relative mt-1 self-start">
              <Button onClick={sendThinkingOfYou} disabled={sending} className="h-[54px] px-7">
                <Icon name="heart" bare size={22} tone="blush" />
                {sent ? 'Enviado' : sending ? 'Enviando…' : 'Pensando en vos'}
              </Button>
              {sent && (
                <>
                  <span className="pointer-events-none absolute left-5 top-0 text-xl" style={{ animation: 'loopy-heart 1.6s ease-out forwards', color: '#FF6F91' }}>♥</span>
                  <span className="pointer-events-none absolute left-16 top-0 text-base" style={{ animation: 'loopy-heart 1.9s .2s ease-out forwards', color: '#7C5CDB' }}>♥</span>
                  <span className="pointer-events-none absolute left-28 top-0 text-2xl" style={{ animation: 'loopy-heart 1.7s .1s ease-out forwards', color: '#F2733F' }}>♥</span>
                </>
              )}
            </div>
          </div>
          <div className="relative grid shrink-0 place-items-center">
            <LoopyMascot size={160} expression={partnerStatus ? 'loving' : 'waiting'} className="sm:h-[190px] sm:w-[190px]" />
          </div>
        </section>

        {/* Días juntos */}
        <section className="card flex flex-col items-center justify-center gap-2 text-center">
          <span className="eyebrow">Juntos hace</span>
          <div className="relative h-[116px] w-[116px] md:h-[132px] md:w-[132px]">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <defs>
                <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#C9B8FF" />
                  <stop offset="1" stopColor="#FFB8D1" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="44" fill="none" stroke="#F3EEFF" strokeWidth="9" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="url(#ring)" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <div className="font-display text-4xl font-semibold leading-none text-plum">{days ?? '—'}</div>
                <div className="text-xs font-semibold text-ink-soft">días</div>
              </div>
            </div>
          </div>
          {days !== null && nextMilestone !== null && (
            <p className="m-0 text-[13px] font-semibold text-ink-soft">
              Faltan <b className="text-ink">{nextMilestone - days}</b> para los {nextMilestone}
            </p>
          )}
        </section>

        <WeekMoods />
        <DailyQuestion />

        {/* Canción */}
        <Link to="/app/musica" className="col-span-1 block no-underline">
          <div className="card card-lift flex h-full flex-col gap-3 bg-gradient-to-br from-[#E4D9FF] to-[#FFE0EA]">
            <Eyebrow icon="musica">Canción del día</Eyebrow>
            {song ? (
              <div className="flex items-center gap-3">
                {song.imagen ? (
                  <img src={song.imagen} alt="" className="h-14 w-14 shrink-0 rounded-[18px] object-cover" />
                ) : (
                  <Icon name="musica" size={56} />
                )}
                <div className="min-w-0">
                  <p className="m-0 truncate font-bold text-ink">{song.titulo}</p>
                  {song.artista && <p className="m-0 truncate text-[13px] text-ink-soft">{song.artista}</p>}
                </div>
              </div>
            ) : (
              <p className="m-0 text-sm text-ink-soft">Todavía no eligieron una.</p>
            )}
            {song?.nota && <p className="m-0 font-hand text-xl leading-tight text-ink-soft">“{song.nota}”</p>}
          </div>
        </Link>

        {/* Próximo plan */}
        <Link to="/app/calendario" className="col-span-1 block no-underline md:col-span-2">
          <div className="card card-lift flex h-full flex-col gap-3 bg-[#EAF4FF]">
            <Eyebrow icon="calendario">Próximo plan</Eyebrow>
            {nextEvent ? (
              <div className="flex items-center gap-3">
                <div className="w-[60px] shrink-0 rounded-[20px] bg-white py-2 text-center shadow-[0_6px_16px_rgba(100,150,220,.18)]">
                  <div className="text-[11px] font-extrabold uppercase text-coral">
                    {new Date(nextEvent.inicio).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}
                  </div>
                  <div className="font-display text-[28px] font-semibold leading-none">{new Date(nextEvent.inicio).getDate()}</div>
                </div>
                <div className="min-w-0">
                  <p className="m-0 truncate font-bold text-ink">{nextEvent.titulo}</p>
                  <Chip tone="sky">{evDays === 0 ? '¡Hoy!' : evDays === 1 ? 'Mañana' : `en ${evDays} días`}</Chip>
                </div>
              </div>
            ) : (
              <p className="m-0 text-sm text-ink-soft">Nada agendado todavía.</p>
            )}
          </div>
        </Link>

        {/* Cena */}
        <Link to="/app/comidas" className="col-span-1 block no-underline">
          <div className="card card-lift flex h-full flex-col gap-3 bg-[#E8F8F0]">
            <Eyebrow icon="comidas">Hoy cenamos</Eyebrow>
            <p className={`m-0 ${dinner ? 'font-display text-xl font-semibold leading-tight text-ink' : 'text-sm text-ink-soft'}`}>
              {dinner ?? 'Sin definir todavía.'}
            </p>
          </div>
        </Link>

        {/* Pelis */}
        <Link to="/app/pelis" className="col-span-1 block no-underline">
          <div className="card card-lift flex h-full flex-col gap-3 bg-[#EAF4FF]">
            <Eyebrow icon="pelis">¿Qué vemos?</Eyebrow>
            <p className="m-0 text-sm text-ink-soft">
              {pending > 0 ? `${pending} en la lista “por ver”.` : 'Agreguen la primera peli.'}
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-[#3B84D9]">
              <Icon name="dice" bare size={18} /> Ruleta
            </span>
          </div>
        </Link>

        {/* Carta */}
        <Link to="/app/cartas" className="col-span-1 block no-underline">
          <div className="card card-lift flex h-full flex-col gap-3 bg-[#FFEEF4]">
            <Eyebrow icon="cartas">Última carta</Eyebrow>
            <p className="m-0 line-clamp-2 font-hand text-2xl leading-none text-ink">
              {lastLetter ? lastLetter.titulo : 'Todavía no hay cartas.'}
            </p>
          </div>
        </Link>

        {/* Notitas */}
        <Link to="/app/notitas" className="col-span-2 block no-underline">
          <div className="card card-lift flex h-full flex-col gap-3 bg-[#FFF8E1]">
            <Eyebrow icon="notitas">La heladera</Eyebrow>
            {notes.length ? (
              <div className="flex flex-wrap gap-3">
                {notes.map((n, i) => (
                  <div
                    key={n.id}
                    className="line-clamp-3 min-w-[100px] flex-1 rounded-[20px_20px_20px_8px] p-3 font-hand text-xl leading-none text-ink shadow-[0_8px_16px_rgba(200,160,40,.2)]"
                    style={{ background: NOTE_BG[n.color] ?? NOTE_BG.butter, transform: `rotate(${(i - 1) * 2.5}deg)` }}
                  >
                    {n.texto}
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 text-sm text-ink-soft">Dejale una notita a tu pareja.</p>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
}
