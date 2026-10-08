import { useRef, useState } from 'react'
import { LoopyMascot } from '../LoopyMascot'
import { Icon, type IconName } from './Icon'

type Expr = 'happy' | 'loving' | 'sleepy' | 'thinking' | 'waiting' | 'celebrating'

const GESTURES: { expr: Expr; anim: string; icons: IconName[] }[] = [
  { expr: 'loving', anim: 'loopy-jump 0.8s', icons: ['heart', 'heart', 'sparkle', 'heart', 'cartas'] },
  { expr: 'celebrating', anim: 'loopy-spin 0.9s', icons: ['confetti', 'star', 'sparkle', 'gift', 'confetti'] },
  { expr: 'sleepy', anim: 'loopy-squish 1s', icons: ['moon', 'cloud', 'moon', 'star'] },
  { expr: 'thinking', anim: 'loopy-wiggle 0.9s', icons: ['question', 'ideas', 'sparkle', 'question'] },
  { expr: 'happy', anim: 'loopy-jump 0.8s', icons: ['musica', 'popcorn', 'pot', 'pelis', 'heart'] },
]

interface Props {
  size?: number
  expression?: Expr
  colorA?: string
  colorB?: string
  className?: string
}

export function InteractiveLoopy({ size = 280, expression = 'happy', colorA, colorB, className = '' }: Props) {
  const [g, setG] = useState<{ n: number; i: number } | null>(null)
  const last = useRef(-1)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function poke() {
    let i = Math.floor(Math.random() * GESTURES.length)
    if (i === last.current) i = (i + 1) % GESTURES.length
    last.current = i
    setG((p) => ({ n: (p?.n ?? 0) + 1, i }))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setG(null), 2600)
  }

  const gesture = g ? GESTURES[g.i] : null
  const iconSize = Math.max(34, Math.round(size * 0.2))

  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {gesture &&
        gesture.icons.map((name, k) => {
          const total = gesture.icons.length
          const angle = (-160 + (k * 140) / Math.max(1, total - 1) + (Math.random() * 16 - 8)) * (Math.PI / 180)
          const r = size * (0.62 + Math.random() * 0.2)
          return (
            <span
              key={`${g!.n}-${k}`}
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 -ml-[17px] -mt-[17px]"
              style={{
                ['--dx' as string]: `${Math.cos(angle) * r}px`,
                ['--dy' as string]: `${Math.sin(angle) * r}px`,
                animation: `loopy-burst 1.5s ${k * 0.08}s ease-out both`,
              }}
            >
              <Icon name={name} size={iconSize} />
            </span>
          )
        })}

      <button
        type="button"
        onClick={poke}
        aria-label="Tocá a Loopy"
        className="block h-full w-full cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-lavender"
      >
        <div key={g?.n ?? 0} style={{ animation: gesture?.anim, transformOrigin: '50% 90%' }}>
          <LoopyMascot size={size} expression={gesture?.expr ?? expression} colorA={colorA} colorB={colorB} />
        </div>
      </button>
    </div>
  )
}
