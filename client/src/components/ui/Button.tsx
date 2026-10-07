import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'primary-soft' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-plum text-white shadow-[var(--shadow-loopy-md)] hover:brightness-110',
  'primary-soft': 'bg-grad-loop text-ink shadow-[var(--shadow-loopy-sm)] hover:brightness-105',
  secondary: 'bg-lilac-mist text-plum hover:brightness-95',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-soft',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold
        transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        active:scale-[0.97] hover:-translate-y-0.5
        ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
