import type { ReactNode } from 'react'
import { Icon, type IconName, type Tone } from './Icon'
import { LoopyMascot } from '../LoopyMascot'

export function Page({ children, max = 800 }: { children: ReactNode; max?: number }) {
  return (
    <div className="mx-auto w-full px-4 pb-8 pt-2 md:px-8 md:pt-4" style={{ maxWidth: max + 64 }}>
      {children}
    </div>
  )
}

export function PageHeader({
  icon, title, subtitle, action,
}: { icon: IconName; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Icon name={icon} size={52} />
        <div className="min-w-0">
          <h1 className="m-0 text-[26px] leading-tight text-ink md:text-[32px]">{title}</h1>
          {subtitle && <p className="m-0 mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  text, expression = 'thinking',
}: { text: string; expression?: 'thinking' | 'waiting' | 'sleepy' }) {
  return (
    <div className="card col-span-full flex flex-col items-center gap-3 bg-white/70 py-10 text-center">
      <LoopyMascot size={96} expression={expression} />
      <p className="m-0 max-w-xs text-ink-soft">{text}</p>
    </div>
  )
}

export function IconBtn({
  icon, label, onClick, danger = false,
}: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-full transition-all hover:scale-110 active:scale-90 ${
        danger ? 'bg-[#FFE6EA]' : 'bg-lilac-mist'
      }`}
    >
      <Icon name={icon} size={20} bare tone={danger ? 'blush' : 'lavender'} />
    </button>
  )
}

export function Chip({
  children, tone = 'lavender', active = true, onClick,
}: { children: ReactNode; tone?: Tone; active?: boolean; onClick?: () => void }) {
  const bg: Record<Tone, string> = {
    lavender: '#E9E0FF', blush: '#FFE0EA', peach: '#FFE3D6', mint: '#D5F3E6', butter: '#FFF0BF', sky: '#D6E9FF',
  }
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-ink transition-all ${
        onClick ? 'active:scale-95' : ''
      }`}
      style={{ background: active ? bg[tone] : '#F5F0EB', opacity: active ? 1 : 0.7 }}
    >
      {children}
    </Tag>
  )
}

export function FormCard({ children, onSubmit }: { children: ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form onSubmit={onSubmit} className="card animate-pop mb-6 flex flex-col gap-3">
      {children}
    </form>
  )
}
