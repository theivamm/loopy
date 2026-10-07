import type { ReactNode } from 'react'

interface BentoCardProps {
  children: ReactNode
  className?: string
  gradient?: 'loop' | 'love' | 'dream' | 'fresh' | 'sunny' | 'hero' | null
  onClick?: () => void
}

const gradientClass: Record<NonNullable<BentoCardProps['gradient']>, string> = {
  loop: 'bg-grad-loop',
  love: 'bg-grad-love',
  dream: 'bg-grad-dream',
  fresh: 'bg-grad-fresh',
  sunny: 'bg-grad-sunny',
  hero: 'bg-grad-hero',
}

export function BentoCard({ children, className = '', gradient = null, onClick }: BentoCardProps) {
  const bg = gradient ? gradientClass[gradient] : 'bg-surface border border-line'

  return (
    <div
      onClick={onClick}
      className={`rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-loopy-sm)] ${bg} ${
        onClick ? 'cursor-pointer transition-transform hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
