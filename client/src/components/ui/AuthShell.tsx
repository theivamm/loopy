import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Blobs } from './Blobs'
import { Icon, type IconName } from './Icon'
import { InteractiveLoopy } from './InteractiveLoopy'

type Expr = 'happy' | 'loving' | 'sleepy' | 'thinking' | 'waiting' | 'celebrating'

/** Input con ícono a la izquierda. */
export function IconField({ icon, ...props }: { icon: IconName } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
        <Icon name={icon} size={34} />
      </span>
      <input {...props} className={`field !pl-[54px] ${props.className ?? ''}`} />
    </div>
  )
}

/** IconField para contraseñas, con un ojito para mostrar/ocultar el texto. */
export function PasswordField(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
        <Icon name="lock" size={34} />
      </span>
      <input {...props} type={show ? 'text' : 'password'} className={`field !pl-[54px] !pr-[52px] ${props.className ?? ''}`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
      >
        <Icon name={show ? 'eyeOff' : 'eye'} bare size={22} tone="lavender" />
      </button>
    </div>
  )
}

export function AuthShell({
  children, title, subtitle, expression = 'happy', colorA, maxWidth = 460,
}: {
  children: ReactNode
  title: string
  subtitle?: string
  expression?: Expr
  mascotSize?: number
  colorA?: string
  maxWidth?: number
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Blobs />
      <header className="px-5 pt-5 md:px-10 md:pt-8">
        <Link to="/" className="font-display text-2xl font-semibold text-ink no-underline">loopy</Link>
      </header>

      <main className="mx-auto grid w-full max-w-[1120px] flex-1 items-center gap-2 px-4 pb-10 pt-2 md:grid-cols-[1fr_auto] md:gap-12 md:px-10 md:pb-16">
        {/* Mascota */}
        <div className="relative order-1 flex flex-col items-center justify-center md:min-h-[520px]">
          <div className="absolute inset-x-6 top-1/2 hidden h-[360px] -translate-y-1/2 rounded-full bg-gradient-to-br from-[#E4D9FF] to-[#FFE0EA] opacity-80 blur-3xl md:block" />
          <div className="relative md:hidden">
            <InteractiveLoopy size={104} expression={expression} colorA={colorA} />
          </div>
          <div className="relative hidden md:block">
            <InteractiveLoopy size={340} expression={expression} colorA={colorA} />
            <div className="animate-float absolute -left-10 top-4" style={{ ['--r' as string]: '-8deg' }}><Icon name="cartas" size={60} /></div>
            <div className="animate-float absolute -right-8 top-16" style={{ ['--r' as string]: '8deg', animationDelay: '-2s' }}><Icon name="musica" size={56} /></div>
            <div className="animate-float absolute -left-4 bottom-10" style={{ ['--r' as string]: '6deg', animationDelay: '-4s' }}><Icon name="pelis" size={52} /></div>
            <div className="animate-float absolute -right-4 bottom-4" style={{ ['--r' as string]: '-6deg', animationDelay: '-1s' }}><Icon name="calendario" size={56} /></div>
          </div>
          <p className="relative mt-3 hidden items-center gap-2 rounded-full bg-white/80 py-1.5 pl-2 pr-4 text-[13px] font-bold text-ink-soft shadow-[var(--shadow-loopy-sm)] md:inline-flex">
            <Icon name="sparkle" size={24} /> Tocá a Loopy
          </p>
        </div>

        {/* Form */}
        <div className="order-2 w-full justify-self-center md:order-2" style={{ maxWidth }}>
          <div className="animate-pop relative overflow-hidden rounded-[44px] border border-white bg-white/85 p-6 shadow-[0_24px_60px_rgba(124,92,219,.18),inset_0_3px_0_#fff] backdrop-blur-xl md:p-9">
            <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-lavender/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-peach/40 blur-3xl" />
            <div className="relative">
              <h1 className="m-0 text-[28px] leading-tight text-ink md:text-[32px]">{title}</h1>
              {subtitle && <p className="m-0 mt-2 text-ink-soft">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
