import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { LoopyMascot } from '../components/LoopyMascot'
import { Blobs } from '../components/ui/Blobs'
import { Icon, type IconName } from '../components/ui/Icon'

const modules: { icon: IconName; title: string; desc: string; bg: string; span?: string }[] = [
  { icon: 'estados', title: 'Estados', desc: 'Ánimo, actividad y disponibilidad de los dos, al instante. Y un “pensando en vos” con un toque.', bg: '#F3EEFF', span: 'sm:col-span-2' },
  { icon: 'cartas', title: 'Cartas', desc: 'Para hoy, para una fecha, o para cuando más las necesiten.', bg: '#FFEEF4' },
  { icon: 'musica', title: 'Música', desc: 'La playlist compartida y la canción del día.', bg: '#FFF1EA' },
  { icon: 'pelis', title: 'Pelis y series', desc: '¿Qué vemos hoy? Que decida Loopy.', bg: '#EDF6FF' },
  { icon: 'calendario', title: 'Calendario', desc: 'Planes, viajes, cumpleaños y aniversarios con cuenta regresiva.', bg: '#F3EEFF' },
  { icon: 'comidas', title: 'Comidas', desc: 'La semana de desayunos, almuerzos y cenas.', bg: '#EAF8F2' },
  { icon: 'notitas', title: 'Notitas', desc: 'La heladera virtual de la pareja.', bg: '#FFF8E1' },
  { icon: 'links', title: 'Links e ideas', desc: 'Lugares, recetas y sueños para no perder.', bg: '#EDF6FF', span: 'sm:col-span-2' },
]

const steps: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'sparkle', title: 'Creen su espacio', desc: 'Elijan su color de hilo y el nombre de su rincón.' },
  { icon: 'send', title: 'Inviten a su pareja', desc: 'Un link o un código de 6 dígitos. Vence en 7 días.' },
  { icon: 'heart', title: 'Empiecen a compartir', desc: 'Los dos hilos se entrelazan y nace su Loopy.' },
]

const faqs = [
  ['¿Es gratis?', 'Sí. El plan gratis incluye estados, notitas, links, música, pelis, calendario y 5 cartas por mes. Loopy Plus agrega más.'],
  ['¿Quién ve lo que guardamos?', 'Solo ustedes dos. Todo está protegido por espacio y no hay anuncios ni venta de datos.'],
  ['¿Qué pasa si nos separamos?', 'Cualquiera puede salir del espacio y llevarse una copia. Loopy nunca se pone triste: espera tranquilo.'],
  ['¿Funciona en el celular?', 'Sí. Loopy está pensado primero para el celular, con una barra inferior y todo a un toque.'],
]

function Section({ children, id }: { children: ReactNode; id?: string }) {
  return <section id={id} className="mx-auto w-full max-w-[1160px] px-5 py-12 md:px-8 md:py-20">{children}</section>
}

function Float({ icon, className, r }: { icon: IconName; className: string; r: string }) {
  return (
    <div className={`animate-float absolute ${className}`} style={{ ['--r' as string]: r }}>
      <Icon name={icon} size={56} />
    </div>
  )
}

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Blobs />

      <header className="mx-auto flex max-w-[1160px] items-center justify-between gap-2 px-4 py-4 md:px-8 md:py-6">
        <div className="flex items-center gap-2">
          <LoopyMascot size={38} />
          <span className="font-display text-2xl font-semibold text-ink">loopy</span>
        </div>
        <nav className="flex items-center gap-1.5 md:gap-3">
          <Link to="/login" className="no-underline"><Button variant="ghost" size="sm">Entrar</Button></Link>
          <Link to="/signup" className="no-underline"><Button size="sm">Crear espacio</Button></Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1160px] items-center gap-6 px-5 pb-10 pt-6 md:grid-cols-[1.1fr_1fr] md:gap-10 md:px-8 md:pb-20 md:pt-12">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 py-1.5 pl-2 pr-4 text-[13px] font-bold text-plum shadow-[var(--shadow-loopy-sm)]">
            <Icon name="sparkle" size={26} /> Dos vidas, un mismo lazo
          </span>
          <h1 className="m-0 mt-5 text-balance text-[40px] leading-[1.05] text-ink md:text-[64px]">
            Su rincón, <span className="bg-gradient-to-r from-[#7C5CDB] to-[#F2733F] bg-clip-text text-transparent">solo de ustedes.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg text-ink-soft md:mx-0">
            Música, películas, cartas y planes. Todo lo que comparten, en un mismo lazo.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row md:justify-start">
            <Link to="/signup" className="no-underline"><Button className="h-14 w-full px-8 text-base sm:w-auto">Crear nuestro espacio</Button></Link>
            <a href="#como-funciona" className="no-underline"><Button variant="secondary" className="h-14 w-full px-8 text-base sm:w-auto">Ver cómo funciona</Button></a>
          </div>
        </div>

        <div className="relative mx-auto grid h-[320px] w-full max-w-[420px] place-items-center md:h-[440px]">
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#E4D9FF] to-[#FFE0EA] opacity-80 blur-2xl" />
          <LoopyMascot size={260} expression="loving" className="relative md:h-[330px] md:w-[330px]" />
          <Float icon="cartas" className="left-0 top-6 md:-left-2" r="-8deg" />
          <Float icon="musica" className="right-0 top-14" r="8deg" />
          <Float icon="pelis" className="bottom-10 left-2" r="6deg" />
          <Float icon="comidas" className="bottom-4 right-4" r="-6deg" />
        </div>
      </section>

      {/* Problema */}
      <Section>
        <div className="card mx-auto max-w-3xl bg-white/80 text-center !p-8 md:!p-12">
          <h2 className="m-0 text-balance text-2xl text-ink md:text-4xl">Las canciones por un lado, los planes en el chat… y todo se pierde.</h2>
          <p className="mx-auto mb-0 mt-4 max-w-xl text-ink-soft">Loopy junta lo que comparten en un solo lugar, que es solo de ustedes y que con el tiempo se vuelve el archivo de su historia.</p>
        </div>
      </Section>

      {/* Bento */}
      <Section>
        <h2 className="m-0 text-center text-3xl text-ink md:text-5xl">Todo en un solo lazo</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:grid-cols-4 md:gap-5">
          {modules.map((m) => (
            <div key={m.title} className={`card card-lift flex flex-col gap-3 ${m.span ?? ''} ${m.span ? 'md:col-span-2' : ''}`} style={{ background: m.bg }}>
              <Icon name={m.icon} size={56} />
              <h3 className="m-0 font-sans text-lg font-extrabold text-ink">{m.title}</h3>
              <p className="m-0 text-sm text-ink-soft">{m.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Cómo funciona */}
      <Section id="como-funciona">
        <h2 className="m-0 text-center text-3xl text-ink md:text-5xl">Cómo funciona</h2>
        <div className="relative mt-10 grid gap-5 md:mt-14 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-[52px] hidden h-1 rounded-full bg-gradient-to-r from-lavender to-peach opacity-60 md:block" />
          {steps.map((s, i) => (
            <div key={s.title} className="card relative flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <Icon name={s.icon} size={72} />
                <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-plum text-sm font-extrabold text-white ring-4 ring-white">{i + 1}</span>
              </div>
              <h3 className="m-0 font-sans text-lg font-extrabold text-ink">{s.title}</h3>
              <p className="m-0 text-sm text-ink-soft">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Conocé a Loopy */}
      <Section>
        <div className="card relative grid items-center gap-6 overflow-hidden bg-grad-loop !p-8 md:grid-cols-2 md:!p-14">
          <div className="pointer-events-none absolute -right-10 -top-16 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
          <div className="relative text-center md:text-left">
            <h2 className="m-0 text-3xl text-ink md:text-5xl">Conocé a Loopy</h2>
            <p className="mt-4 text-ink/80">Un ovillito hecho de dos hilos, uno por cada uno de ustedes. Crece y se entrelaza cuanto más lo usan juntos. Si se van, se duerme y los espera tranquilo.</p>
          </div>
          <div className="relative flex flex-wrap items-end justify-center gap-4">
            <LoopyMascot size={92} expression="happy" />
            <LoopyMascot size={92} expression="loving" />
            <LoopyMascot size={92} expression="sleepy" />
            <LoopyMascot size={92} expression="thinking" />
          </div>
        </div>
      </Section>

      {/* Privacidad */}
      <Section>
        <div className="grid gap-5 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div className="text-center md:text-left">
            <Icon name="shield" size={72} className="mx-auto md:mx-0" />
            <h2 className="m-0 mt-4 text-3xl text-ink md:text-4xl">Lo que pasa en Loopy, queda entre ustedes.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['lock', 'Privado por espacio'], ['close', 'Sin anuncios'], ['users', 'Solo dos personas']].map(([ic, t]) => (
              <div key={t} className="card flex flex-col items-center gap-3 text-center">
                <Icon name={ic as IconName} size={52} />
                <p className="m-0 font-bold text-ink">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Precios */}
      <Section>
        <h2 className="m-0 text-center text-3xl text-ink md:text-5xl">Un plan por pareja</h2>
        <div className="mx-auto mt-8 grid max-w-3xl gap-5 md:mt-12 md:grid-cols-2">
          <div className="card flex flex-col gap-3">
            <h3 className="m-0 text-2xl">Gratis</h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-ink-soft">
              {['Estados, notitas y links', 'Música y pelis', 'Calendario de eventos', '5 cartas por mes'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Icon name="check" bare size={18} tone="mint" />{t}</li>
              ))}
            </ul>
            <Link to="/signup" className="mt-auto no-underline"><Button variant="secondary" className="mt-3 w-full">Empezar gratis</Button></Link>
          </div>
          <div className="card relative flex flex-col gap-3 overflow-hidden bg-grad-loop shadow-[var(--shadow-fluffy-lg)]">
            <span className="absolute right-5 top-5 rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold text-plum">Próximamente</span>
            <h3 className="m-0 text-2xl">Loopy Plus</h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-ink/80">
              {['Cartas ilimitadas y programadas', 'Recetas y lista de compras', 'Fotos y recuerdos', 'Cápsula del tiempo y accesorios'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Icon name="sparkle" bare size={18} tone="butter" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <h2 className="m-0 text-center text-3xl text-ink md:text-5xl">Preguntas frecuentes</h2>
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="card group !py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <span className="transition-transform duration-300 group-open:rotate-45"><Icon name="plus" size={32} /></span>
              </summary>
              <p className="m-0 mt-3 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA final */}
      <Section>
        <div className="card flex flex-col items-center gap-4 bg-white/80 text-center !p-8 md:!p-14">
          <LoopyMascot size={120} expression="celebrating" />
          <h2 className="m-0 text-3xl text-ink md:text-5xl">Empiecen hoy, es gratis.</h2>
          <Link to="/signup" className="no-underline"><Button className="h-14 px-10 text-base">Crear nuestro espacio</Button></Link>
        </div>
      </Section>

      <footer className="pb-10 text-center text-sm text-ink-muted">loopy · two lives, one loop</footer>
    </div>
  )
}
