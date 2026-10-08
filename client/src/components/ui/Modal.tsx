import { useEffect, type ReactNode } from 'react'
import { IconBtn } from './PageShell'

export function Modal({ title, onClose, children, max = 560 }: { title: string; onClose: () => void; children: ReactNode; max?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-sm md:items-center md:p-8" onClick={onClose}>
      <div
        className="animate-sheet md:animate-pop flex max-h-[92vh] w-full flex-col gap-5 overflow-y-auto rounded-t-[40px] bg-cream p-6 md:rounded-[40px] md:p-8"
        style={{ maxWidth: max }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-xl text-ink">{title}</h2>
          <IconBtn icon="close" label="Cerrar" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  )
}
