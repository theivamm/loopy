import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { LoopyMascot } from '../components/LoopyMascot'
import { Blobs } from '../components/ui/Blobs'
import { Icon, type IconName } from '../components/ui/Icon'

export const WELCOME_SEEN_KEY = 'loopy_seen_welcome'

interface Slide {
  expression: 'loving' | 'happy' | 'celebrating'
  title: string
  desc: string
  icons?: IconName[]
}

const SLIDES: Slide[] = [
  {
    expression: 'loving',
    title: 'Dos vidas, un mismo lazo.',
    desc: 'El rincón privado y compartido para parejas. Solo ustedes dos.',
  },
  {
    expression: 'happy',
    title: 'Todo en un solo lugar.',
    desc: 'Estados, cartas, música, pelis, planes y recuerdos — nada se pierde en el chat.',
    icons: ['estados', 'cartas', 'musica', 'pelis'],
  },
  {
    expression: 'celebrating',
    title: 'Empiecen cuando quieran.',
    desc: 'Creen su espacio o entren si su pareja ya los invitó.',
  },
]

export default function AppWelcome() {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1
  const slide = SLIDES[i]

  function markSeen() {
    try {
      localStorage.setItem(WELCOME_SEEN_KEY, '1')
    } catch {
      // localStorage can throw in rare private-mode setups; the carousel
      // just reappears next open, which is harmless.
    }
  }

  function goTo(path: string) {
    markSeen()
    navigate(path)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <Blobs />

      <button
        onClick={() => setI(SLIDES.length - 1)}
        className={`absolute right-5 top-5 z-10 text-sm font-bold text-ink-soft transition-opacity ${last ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        Saltar
      </button>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <LoopyMascot size={140} expression={slide.expression} />

        {slide.icons && (
          <div className="mt-6 flex gap-3">
            {slide.icons.map((ic) => (
              <div key={ic} className="rounded-[20px] bg-white/80 p-3 shadow-[var(--shadow-loopy-sm)]">
                <Icon name={ic} size={32} />
              </div>
            ))}
          </div>
        )}

        <h1 className="m-0 mt-7 text-balance font-display text-3xl text-ink">{slide.title}</h1>
        <p className="mx-auto mb-0 mt-3 max-w-xs text-ink-soft">{slide.desc}</p>
      </div>

      <div className="relative flex items-center justify-center gap-2 pb-6">
        {SLIDES.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-plum' : 'w-2 bg-plum/25'}`}
          />
        ))}
      </div>

      <div className="relative flex flex-col gap-3 px-6 pb-10">
        {last ? (
          <>
            <Button className="h-14 w-full text-base" onClick={() => goTo('/signup')}>
              Crear nuestro espacio
            </Button>
            <Button variant="secondary" className="h-14 w-full text-base" onClick={() => goTo('/login')}>
              Ya tengo cuenta
            </Button>
          </>
        ) : (
          <Button className="h-14 w-full text-base" onClick={() => setI((v) => v + 1)}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  )
}
