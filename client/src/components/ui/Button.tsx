import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'primary-soft' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'sm'
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-plum text-white shadow-[0_10px_26px_rgba(124,92,219,.36),inset_0_2px_0_rgba(255,255,255,.28)] hover:brightness-110',
  'primary-soft':
    'bg-grad-loop text-ink shadow-[0_8px_20px_rgba(124,92,219,.16),inset_0_2px_0_rgba(255,255,255,.6)] hover:brightness-105',
  secondary: 'bg-lilac-mist text-plum hover:bg-plum hover:text-white',
  ghost: 'bg-transparent text-ink-soft hover:bg-white/70',
  danger: 'bg-[#FFE6EA] text-error hover:bg-error hover:text-white',
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-variant={variant}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        active:scale-[0.96] enabled:hover:-translate-y-0.5
        ${size === 'sm' ? 'h-10 px-4 text-sm' : 'h-12 px-6 text-[15px]'}
        ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
