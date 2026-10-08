import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName, type Tone } from './Icon'
import { LoopyMascot } from '../LoopyMascot'

export function Page({ children, max = 1480 }: { children: ReactNode; max?: number }) {
  return (
    <div className="mx-auto w-full px-4 pb-8 pt-2 md:px-6 md:pt-4" style={{ maxWidth: max + 64 }}>
      {children}
    </div>
  )
}

export function PageHeader({
  icon, title, subtitle, action,
}: { icon: IconName; title: string; subtitle?: string; action?: ReactNode }) {
  const [slots, setSlots] = useState<{ t: HTMLElement | null; a: HTMLElement | null }>({ t: null, a: null })
  useEffect(() => {
    setSlots({ t: document.getElementById('topbar-slot'), a: document.getElementById('topbar-actions') })
  }, [])

  const block = (
    <div className="flex min-w-0 items-center gap-3">
      <Icon name={icon} size={46} />
      <div className="min-w-0">
        <h1 className="m-0 truncate text-[24px] leading-tight text-ink md:text-[28px]">{title}</h1>
        {subtitle && <p className="m-0 truncate text-[13px] text-ink-soft">{subtitle}</p>}
      </div>
    </div>
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 md:hidden">
        {block}
        {action}
      </div>
      {slots.t && createPortal(block, slots.t)}
      {slots.a && action && createPortal(action, slots.a)}
    </>
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
    <form onSubmit={onSubmit} className="card animate-pop mb-6 flex max-w-3xl flex-col gap-3">
      {children}
    </form>
  )
}
