import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { BentoCard } from '../components/ui/BentoCard'
import { LoopyMascot } from '../components/LoopyMascot'

const modules = [
  { emoji: '💭', title: 'Estados', desc: 'Ánimo y disponibilidad, al instante.', bg: 'bg-[#F3EEFF]' },
  { emoji: '💌', title: 'Cartas', desc: 'Para hoy, para una fecha, o para cuando más lo necesiten.', bg: 'bg-[#FFEEF4]' },
  { emoji: '🎵', title: 'Música', desc: 'La playlist que están armando juntos.', bg: 'bg-[#F3EEFF]' },
  { emoji: '🎬', title: 'Pelis y series', desc: '¿Qué vemos hoy? Loopy decide.', bg: 'bg-[#EDF6FF]' },
  { emoji: '📅', title: 'Calendario', desc: 'Planes, cumpleaños y aniversarios.', bg: 'bg-[#EDF6FF]' },
  { emoji: '🗒️', title: 'Notitas', desc: 'La heladera virtual de la pareja.', bg: 'bg-[#FFF8E1]' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-grad-hero">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-6">
        <span className="font-display text-xl font-semibold text-ink">loopy</span>
        <nav className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost">Iniciar sesión</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Crear nuestro espacio</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 px-8 py-16 md:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-6xl">
            Su rincón, solo de ustedes.
          </h1>
          <p className="mt-4 max-w-md text-lg text-ink-soft">
            Música, películas, cartas y planes. Todo lo que comparten, en un mismo lazo.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/signup">
              <Button variant="primary">Crear nuestro espacio</Button>
            </Link>
            <Button variant="ghost">Ver cómo funciona</Button>
          </div>
        </div>
        <div className="flex justify-center">
          <LoopyMascot size={220} expression="loving" />
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-8 py-16">
        <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          Todo en un solo lazo
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3">
          {modules.map((m) => (
            <BentoCard key={m.title} className={m.bg}>
              <div className="text-2xl">{m.emoji}</div>
              <h3 className="mt-2 font-sans text-lg font-bold text-ink">{m.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{m.desc}</p>
            </BentoCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-8 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          Empiecen hoy, es gratis.
        </h2>
        <div className="mt-6 flex justify-center">
          <Link to="/signup">
            <Button variant="primary">Crear nuestro espacio</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-muted">
        loopy · two lives, one loop
      </footer>
    </div>
  )
}
