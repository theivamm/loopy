import { useRef, type ReactNode } from 'react'
import { Icon, type IconName } from '../ui/Icon'
import { SEAL_COLORS, paperStyle, contentStyle, toHtml, type Deco, type Paper } from '../../lib/letterStyle'

export function Seal({ spec, size }: { spec: string; size: number }) {
  const [color, icon] = spec.split('|')
  const [a, b] = SEAL_COLORS[color] ?? SEAL_COLORS.lavanda
  return (
    <span
      className="grid place-items-center rounded-full"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 30% 28%, ${a}, ${b})`,
        boxShadow: `0 6px 14px ${b}66, inset 0 -3px 0 rgba(0,0,0,.12), inset 0 3px 0 rgba(255,255,255,.4)`,
        outline: `${Math.max(2, size / 14)}px dashed rgba(255,255,255,.45)`,
        outlineOffset: -size / 8,
      }}
    >
      <Icon name={(icon as IconName) ?? 'heart'} bare size={Math.round(size * 0.46)} tone="blush" />
    </span>
  )
}

export function DecoView({ d }: { d: Deco }) {
  if (d.type === 'icon') return <Icon name={d.ref as IconName} size={d.size} />
  if (d.type === 'seal') return <Seal spec={d.ref} size={d.size} />
  return (
    <img
      src={d.ref} alt="" draggable={false}
      className="block rounded-[18%] border-[4px] border-white object-cover shadow-[0_8px_18px_rgba(46,36,64,.22)]"
      style={{ width: d.size, height: d.size }}
    />
  )
}

interface Props {
  paper: Paper
  decos: Deco[]
  html?: string
  editor?: ReactNode
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onMove?: (id: string, x: number, y: number) => void
  className?: string
}

/** Hoja de papel: fondo, texto (o editor), y capa de stickers/sellos arrastrables. */
export function LetterPaper({ paper, decos, html, editor, selectedId, onSelect, onMove, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const editable = Boolean(onMove)

  function startDrag(e: React.PointerEvent, d: Deco) {
    if (!editable || !ref.current) return
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(d.id)
    const rect = ref.current.getBoundingClientRect()
    const move = (ev: PointerEvent) => {
      const x = Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((ev.clientY - rect.top) / rect.height) * 100))
      onMove?.(d.id, x, y)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={ref}
      onPointerDown={() => onSelect?.(null)}
      className={`relative overflow-hidden rounded-[22px] shadow-[0_18px_44px_rgba(124,92,219,.18),0_2px_0_rgba(255,255,255,.9)_inset] ${className}`}
      style={paperStyle(paper)}
    >
      <div style={contentStyle(paper)}>
        {editor ?? <div className="letter-content" dangerouslySetInnerHTML={{ __html: toHtml(html ?? '') }} />}
      </div>
      <div className="pointer-events-none absolute inset-0">
        {decos.map((d) => (
          <div
            key={d.id}
            onPointerDown={(e) => startDrag(e, d)}
            className={`absolute ${editable ? 'pointer-events-auto cursor-grab touch-none active:cursor-grabbing' : ''}`}
            style={{
              left: `${d.x}%`, top: `${d.y}%`,
              transform: `translate(-50%,-50%) rotate(${d.rot}deg)`,
              outline: selectedId === d.id ? '2px dashed #7C5CDB' : undefined,
              outlineOffset: 6,
              borderRadius: 14,
            }}
          >
            <DecoView d={d} />
          </div>
        ))}
      </div>
    </div>
  )
}
