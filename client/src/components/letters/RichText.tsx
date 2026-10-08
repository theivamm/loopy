import { useEffect, useRef } from 'react'
import { Icon, type IconName } from '../ui/Icon'
import { INKS, sanitizeHtml } from '../../lib/letterStyle'

function exec(cmd: string, value?: string) {
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand(cmd, false, value)
}

function Btn({ icon, label, onRun }: { icon: IconName; label: string; onRun: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => { e.preventDefault(); onRun() }}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all hover:bg-lilac-mist active:scale-90"
    >
      <Icon name={icon} bare size={19} />
    </button>
  )
}

const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-line" />

const HIGHLIGHTS = ['#FFF08A', '#FFC9DB', '#C8F0DF', '#C6E0FF']

/** Barra de formato. Opera sobre la selección actual del editor. */
export function RichToolbar() {
  return (
    <div className="glass flex items-center gap-0.5 overflow-x-auto rounded-full px-2 py-1.5 shadow-[var(--shadow-loopy-md)]">
      <Btn icon="bold" label="Negrita" onRun={() => exec('bold')} />
      <Btn icon="italic" label="Cursiva" onRun={() => exec('italic')} />
      <Btn icon="underline" label="Subrayado" onRun={() => exec('underline')} />
      <Btn icon="strike" label="Tachado" onRun={() => exec('strikeThrough')} />
      <Sep />
      <Btn icon="h2" label="Título" onRun={() => exec('formatBlock', 'h2')} />
      <Btn icon="size" label="Texto más grande" onRun={() => exec('fontSize', '5')} />
      <Btn icon="quote" label="Cita" onRun={() => exec('formatBlock', 'blockquote')} />
      <Sep />
      <Btn icon="ul" label="Lista" onRun={() => exec('insertUnorderedList')} />
      <Btn icon="ol" label="Lista numerada" onRun={() => exec('insertOrderedList')} />
      <Btn icon="alignL" label="Izquierda" onRun={() => exec('justifyLeft')} />
      <Btn icon="alignC" label="Centrar" onRun={() => exec('justifyCenter')} />
      <Btn icon="alignR" label="Derecha" onRun={() => exec('justifyRight')} />
      <Sep />
      <span className="mr-1 grid h-9 w-9 shrink-0 place-items-center"><Icon name="highlighter" bare size={19} /></span>
      {HIGHLIGHTS.map((c) => (
        <button key={c} type="button" aria-label="Resaltar" onMouseDown={(e) => { e.preventDefault(); exec('hiliteColor', c) }}
          className="mx-0.5 h-5 w-5 shrink-0 rounded-full ring-2 ring-white transition-transform hover:scale-125" style={{ background: c }} />
      ))}
      <Sep />
      {INKS.map((c) => (
        <button key={c} type="button" aria-label="Color de texto" onMouseDown={(e) => { e.preventDefault(); exec('foreColor', c) }}
          className="mx-0.5 h-5 w-5 shrink-0 rounded-full ring-2 ring-white transition-transform hover:scale-125" style={{ background: c }} />
      ))}
      <Sep />
      <Btn icon="eraser" label="Quitar formato" onRun={() => { exec('removeFormat'); exec('formatBlock', 'div') }} />
    </div>
  )
}

interface EditorProps { initial: string; onChange: (html: string) => void; placeholder?: string }

export function RichEditor({ initial, onChange, placeholder = 'Escribí lo que sientas…' }: EditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initial ? sanitizeHtml(initial) : ''
  }, [])
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline
      data-placeholder={placeholder}
      className="letter-content min-h-[380px]"
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
      onPaste={(e) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
      }}
    />
  )
}
