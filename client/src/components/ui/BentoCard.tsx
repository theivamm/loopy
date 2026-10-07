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
  return (
    <div
      onClick={onClick}
      className={`card ${gradient ? gradientClass[gradient] : ''} ${onClick ? 'card-lift cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
