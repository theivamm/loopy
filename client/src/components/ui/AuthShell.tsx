import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Blobs } from './Blobs'
import { LoopyMascot } from '../LoopyMascot'

type Expr = 'happy' | 'loving' | 'sleepy' | 'thinking' | 'waiting' | 'celebrating'

export function AuthShell({
  children, title, subtitle, expression = 'happy', mascotSize = 104, colorA, maxWidth = 440,
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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Blobs />
      <Link to="/" className="mb-5 font-display text-2xl font-semibold text-ink no-underline">
        loopy
      </Link>
      <div
        className="animate-pop card relative w-full text-center"
        style={{ maxWidth, borderRadius: 40, padding: '56px 24px 28px' }}
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <LoopyMascot size={mascotSize} expression={expression} colorA={colorA} />
        </div>
        <h1 className="m-0 mt-2 text-[26px] leading-tight text-ink">{title}</h1>
        {subtitle && <p className="m-0 mt-2 text-ink-soft">{subtitle}</p>}
        <div className="mt-6 text-left">{children}</div>
      </div>
    </div>
  )
}
