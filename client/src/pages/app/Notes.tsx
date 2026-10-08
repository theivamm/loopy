import { useEffect, useRef, useState, type FormEvent, type PointerEvent as RPointerEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { notifyPartner } from '../../lib/push'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { LoopyMascot } from '../../components/LoopyMascot'
import { Page, PageHeader, Chip, IconBtn } from '../../components/ui/PageShell'
import type { Note, NoteItem } from '../../types/db'

const COLORS = [
  { key: 'butter', hex: '#FFE8A3' },
  { key: 'blush', hex: '#FFC9DB' },
  { key: 'mint', hex: '#C8F0DF' },
  { key: 'sky', hex: '#C6E0FF' },
  { key: 'lavender', hex: '#E4D9FF' },
  { key: 'peach', hex: '#FFD6BF' },
]
const hexOf = (k: string) => COLORS.find((c) => c.key === k)?.hex ?? COLORS[0].hex
const PINS = [
  { key: 'chincheta', label: 'Chincheta' },
  { key: 'iman', label: 'Imán' },
  { key: 'cinta', label: 'Cinta' },
  { key: 'ninguno', label: 'Nada' },
]
const NOTE_W = 208
type Filter = 'todas' | 'mias' | 'pareja' | 'listas' | 'fijadas'

function PinDeco({ kind }: { kind: string }) {
  if (kind === 'chincheta')
    return <span className="absolute left-1/2 top-[-9px] z-10 h-6 w-6 -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #FFB3A1, #E5586F)', boxShadow: '0 4px 8px rgba(229,88,111,.45), inset 0 -2px 0 rgba(0,0,0,.12)' }} />
  if (kind === 'iman')
    return <span className="absolute left-1/2 top-[-12px] z-10 h-7 w-7 -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #D8CBFF, #7C5CDB)', boxShadow: '0 6px 10px rgba(124,92,219,.4), inset 0 -3px 0 rgba(0,0,0,.14)' }} />
  if (kind === 'cinta')
    return <span className="absolute left-1/2 top-[-12px] z-10 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-[4px]" style={{ background: 'repeating-linear-gradient(135deg, rgba(255,255,255,.75) 0 6px, rgba(255,226,150,.75) 6px 12px)', boxShadow: '0 2px 6px rgba(46,36,64,.15)' }} />
  return null
}

interface CardProps {
  note: Note
  mine: boolean
  uid?: string
  board?: boolean
  onLike: () => void
  onToggle: (itemId: string) => void
}

function NoteCard({ note, mine, uid, board, onLike, onToggle }: CardProps) {
  const liked = !!uid && note.me_gusta?.includes(uid)
  const items = note.items ?? []
  const shown = items.slice(0, board ? 8 : 6)
  return (
    <div
      className="relative flex min-h-[150px] flex-col gap-2 rounded-[14px_14px_14px_36px] px-[18px] pb-3 pt-6 text-ink shadow-[0_12px_22px_rgba(124,92,219,.16)]"
      style={{ background: hexOf(note.color) }}
    >
      <PinDeco kind={note.pin} />
      {note.fijada && <span className="absolute right-3 top-2 text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">fijada</span>}
      {note.tipo === 'lista' ? (
        <>
          <p className="m-0 font-hand text-[26px] font-semibold leading-none">{note.texto}</p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {shown.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onToggle(it.id) }}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink/40 ${it.done ? 'bg-ink/80' : 'bg-white/60'}`}>
                    {it.done && <Icon name="check" bare size={12} tone="lavender" className="[&_*]:!fill-white" />}
                  </span>
                  <span className={`font-hand text-[21px] leading-[1.05] ${it.done ? 'line-through opacity-50' : ''}`}>{it.t}</span>
                </button>
              </li>
            ))}
          </ul>
          {items.length > shown.length && <p className="m-0 text-xs font-bold text-ink-soft">+{items.length - shown.length} más</p>}
        </>
      ) : (
        <p className={`m-0 whitespace-pre-wrap break-words font-hand text-[25px] leading-[1.05] ${board ? 'line-clamp-8' : 'line-clamp-6'}`}>{note.texto}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-soft">
          <i className="h-2 w-2 rounded-full" style={{ background: mine ? '#7C5CDB' : '#F2733F' }} />
          {mine ? 'Vos' : 'Tu pareja'}
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onLike() }}
          aria-label="Me gusta"
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-transform hover:scale-110 active:scale-90 ${liked ? 'bg-white text-[#E8588A]' : 'bg-white/50 text-ink-soft'}`}
        >
          <Icon name="heart" bare size={14} tone={liked ? 'blush' : 'lavender'} />
          {note.me_gusta?.length ? note.me_gusta.length : ''}
        </button>
      </div>
    </div>
  )
}

/* ───────── Editor ───────── */
function NoteEditor({ note, canDelete, onClose, onSave, onDelete }: {
  note: Note; canDelete: boolean; onClose: () => void; onSave: (p: Partial<Note>) => void; onDelete: () => void
}) {
  const [texto, setTexto] = useState(note.texto)
  const [color, setColor] = useState(note.color)
  const [pin, setPin] = useState(note.pin)
  const [fijada, setFijada] = useState(note.fijada)
  const [items, setItems] = useState<NoteItem[]>(note.items ?? [])
  const isList = note.tipo === 'lista'

  const patch = (id: string, p: Partial<NoteItem>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)))

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm md:items-center md:p-8" onClick={onClose}>
      <div className="animate-sheet md:animate-pop flex max-h-[92vh] w-full max-w-[560px] flex-col gap-5 overflow-y-auto rounded-t-[40px] bg-cream p-6 md:rounded-[40px] md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl text-ink">{isList ? 'Editar lista' : 'Editar notita'}</h2>
          <IconBtn icon="close" label="Cerrar" onClick={onClose} />
        </div>

        <div className="rounded-[14px_14px_14px_36px] p-5 shadow-[0_12px_22px_rgba(124,92,219,.16)] transition-colors" style={{ background: hexOf(color) }}>
          {isList ? (
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Título de la lista" className="mb-3 w-full border-0 bg-transparent font-hand text-[28px] font-semibold text-ink outline-none placeholder:text-ink/40" />
          ) : (
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} autoFocus placeholder="Escribí algo lindo…" className="w-full resize-none border-0 bg-transparent font-hand text-[28px] leading-[1.05] text-ink outline-none placeholder:text-ink/40" />
          )}
          {isList && (
            <div className="flex flex-col gap-1.5">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => patch(it.id, { done: !it.done })} aria-label="Marcar" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink/40 ${it.done ? 'bg-ink/80' : 'bg-white/60'}`}>
                    {it.done && <Icon name="check" bare size={13} className="[&_*]:!fill-white" />}
                  </button>
                  <input value={it.t} onChange={(e) => patch(it.id, { t: e.target.value })} placeholder="Ítem" className={`min-w-0 flex-1 border-0 bg-transparent font-hand text-[24px] text-ink outline-none ${it.done ? 'line-through opacity-50' : ''}`} />
                  <button type="button" onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} aria-label="Quitar ítem" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/50"><Icon name="close" bare size={12} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setItems((p) => [...p, { id: crypto.randomUUID(), t: '', done: false }])} className="mt-1 flex items-center gap-2 self-start rounded-full bg-white/60 px-3.5 py-1.5 text-[13px] font-bold text-ink">
                <Icon name="plus" bare size={14} />Agregar ítem
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="eyebrow m-0 mb-2">Color</p>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button type="button" key={c.key} onClick={() => setColor(c.key)} aria-label={c.key} className={`h-10 w-10 rounded-full shadow-[inset_0_2px_0_rgba(255,255,255,.7),0_4px_10px_rgba(124,92,219,.15)] transition-transform ${color === c.key ? 'scale-110 outline outline-[3px] outline-plum' : 'hover:scale-105'}`} style={{ background: c.hex }} />
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow m-0 mb-2">Adorno</p>
            <div className="flex flex-wrap gap-2">
              {PINS.map((p) => (
                <button type="button" key={p.key} onClick={() => setPin(p.key)} className={`rounded-full px-4 py-2 text-[13px] font-bold transition-all ${pin === p.key ? 'bg-plum text-white shadow-[var(--shadow-loopy-md)]' : 'bg-surface-soft text-ink-soft hover:bg-white'}`}>{p.label}</button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setFijada((v) => !v)} className={`flex items-center gap-3 self-start rounded-full py-1.5 pl-1.5 pr-5 text-sm font-bold transition-all ${fijada ? 'bg-lilac-mist text-plum' : 'bg-surface-soft text-ink-soft'}`}>
            <Icon name="star" size={34} />{fijada ? 'Fijada arriba' : 'Fijar arriba'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          {canDelete ? <Button variant="danger" onClick={onDelete}><Icon name="trash" bare size={18} tone="blush" />Sacar</Button> : <span />}
          <Button onClick={() => onSave({ texto, color, pin, fijada, items: items.filter((i) => i.t.trim()) })}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}

/* ───────── Página ───────── */
export default function Notes() {
  const { space, user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState<'nota' | 'lista'>('nota')
  const [color, setColor] = useState('butter')
  const [pin, setPin] = useState('chincheta')
  const [filter, setFilter] = useState<Filter>('todas')
  const [view, setView] = useState<'heladera' | 'grid'>('heladera')
  const [editing, setEditing] = useState<Note | null>(null)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  async function load() {
    if (!space || dragging.current) return
    const { data } = await supabase.from('notes').select('*').eq('space_id', space.id).order('creado_en', { ascending: false })
    setNotes(((data as Note[]) ?? []).map((n) => ({ ...n, items: n.items ?? [], me_gusta: n.me_gusta ?? [] })))
    setLoading(false)
  }
  useEffect(() => { load() }, [space])
  useEffect(() => {
    if (!space) return
    const ch = supabase.channel(`notes-${space.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `space_id=eq.${space.id}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [space])

  async function addNote(e: FormEvent) {
    e.preventDefault()
    if (!space || !user || !texto.trim()) return
    const maxZ = notes.reduce((m, n) => Math.max(m, n.z ?? 0), 0)
    const { data } = await supabase.from('notes').insert({
      space_id: space.id, autor_id: user.id, texto: texto.trim(), tipo, color, pin,
      rotacion: Math.floor(Math.random() * 7) - 3, x: 4 + Math.random() * 70, y: 20 + Math.random() * 320, z: maxZ + 1, items: [],
    }).select('*').single()
    setTexto('')
    if (data) {
      notifyPartner('note', data.id)
      if (tipo === 'lista') setEditing({ ...(data as Note), items: [{ id: crypto.randomUUID(), t: '', done: false }], me_gusta: [] })
    }
    load()
  }

  async function update(id: string, p: Partial<Note>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...p } : n)))
    await supabase.from('notes').update(p).eq('id', id)
  }
  const like = (n: Note) => {
    if (!user) return
    const set = new Set(n.me_gusta ?? [])
    set.has(user.id) ? set.delete(user.id) : set.add(user.id)
    update(n.id, { me_gusta: [...set] })
  }
  const toggleItem = (n: Note, itemId: string) => update(n.id, { items: n.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) })
  async function remove(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    setEditing(null)
    load()
  }

  const shown = notes
    .filter((n) => (filter === 'mias' ? n.autor_id === user?.id : filter === 'pareja' ? n.autor_id !== user?.id : filter === 'listas' ? n.tipo === 'lista' : filter === 'fijadas' ? n.fijada : true))
    .sort((a, b) => Number(b.fijada) - Number(a.fijada))

  /* posiciones de la heladera */
  const autoPos = (i: number) => ({ x: (i % 4) * 32, y: 24 + Math.floor(i / 4) * 250 })
  const posOf = (n: Note, i: number) => {
    if (drag?.id === n.id) return { x: drag.x, y: drag.y }
    return n.x != null && n.y != null ? { x: n.x, y: n.y } : autoPos(i)
  }
  const boardHeight = Math.max(720, ...shown.map((n, i) => posOf(n, i).y + 300))

  function startDrag(e: RPointerEvent, n: Note, i: number) {
    if (!boardRef.current || e.button !== 0) return
    const rect = boardRef.current.getBoundingClientRect()
    const avail = Math.max(1, rect.width - NOTE_W)
    const p0 = posOf(n, i)
    const startX = e.clientX, startY = e.clientY
    const left0 = (p0.x / 100) * avail
    let moved = false
    let last = { x: p0.x, y: p0.y }
    const maxZ = notes.reduce((m, k) => Math.max(m, k.z ?? 0), 0) + 1
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY
      if (!moved && Math.hypot(dx, dy) < 5) return
      moved = true
      dragging.current = true
      last = {
        x: Math.min(100, Math.max(0, ((left0 + dx) / avail) * 100)),
        y: Math.max(0, p0.y + dy),
      }
      setDrag({ id: n.id, ...last })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (moved) {
        update(n.id, { x: last.x, y: last.y, z: maxZ })
        setTimeout(() => { dragging.current = false; setDrag(null) }, 50)
      } else {
        setEditing(n)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const counts = { listas: notes.filter((n) => n.tipo === 'lista').length, fijadas: notes.filter((n) => n.fijada).length }

  return (
    <Page>
      <PageHeader
        icon="notitas"
        title="Notitas"
        subtitle="La heladera virtual de la pareja."
        action={
          <div className="hidden rounded-full bg-white/80 p-1 shadow-[var(--shadow-loopy-sm)] md:flex">
            {(['heladera', 'grid'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-full px-4 py-2 text-[13px] font-bold transition-all ${view === v ? 'bg-plum text-white' : 'text-ink-soft'}`}>{v === 'heladera' ? 'Heladera' : 'Cuadrícula'}</button>
            ))}
          </div>
        }
      />

      <form onSubmit={addNote} className="card mb-6 flex flex-wrap items-center gap-3 !p-3 md:!p-4">
        <div className="flex rounded-full bg-surface-soft p-1">
          {(['nota', 'lista'] as const).map((t) => (
            <button type="button" key={t} onClick={() => setTipo(t)} className={`rounded-full px-4 py-2 text-[13px] font-bold transition-all ${tipo === t ? 'bg-white text-plum shadow-[var(--shadow-loopy-sm)]' : 'text-ink-muted'}`}>{t === 'nota' ? 'Nota' : 'Lista'}</button>
          ))}
        </div>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={tipo === 'nota' ? 'Dejale una notita…' : 'Título de la lista (compras, pendientes…)'} className="field min-w-[200px] flex-1 !bg-surface-soft" maxLength={200} />
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button type="button" key={c.key} onClick={() => setColor(c.key)} aria-label={c.key} className={`h-7 w-7 rounded-full ring-2 ring-white transition-transform ${color === c.key ? 'scale-125 outline outline-2 outline-plum' : 'hover:scale-110'}`} style={{ background: c.hex }} />
          ))}
        </div>
        <select value={pin} onChange={(e) => setPin(e.target.value)} className="field !h-11 !w-auto" aria-label="Adorno">
          {PINS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <Button type="submit"><Icon name="send" bare size={20} tone="lavender" />Pegar</Button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip active={filter === 'todas'} onClick={() => setFilter('todas')}>Todas · {notes.length}</Chip>
        <Chip active={filter === 'mias'} onClick={() => setFilter('mias')}>Mías</Chip>
        <Chip active={filter === 'pareja'} onClick={() => setFilter('pareja')}>De mi pareja</Chip>
        <Chip active={filter === 'listas'} onClick={() => setFilter('listas')}>Listas · {counts.listas}</Chip>
        <Chip active={filter === 'fijadas'} onClick={() => setFilter('fijadas')}>Fijadas · {counts.fijadas}</Chip>
      </div>

      {!loading && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 bg-white/70 py-12 text-center">
          <LoopyMascot size={110} expression="thinking" />
          <p className="m-0 max-w-xs text-ink-soft">La heladera está vacía. ¿Dejamos la primera notita?</p>
        </div>
      )}

      {/* Heladera libre (escritorio) */}
      {view === 'heladera' && shown.length > 0 && (
        <div
          ref={boardRef}
          className="relative hidden overflow-hidden rounded-[44px] border border-white shadow-[var(--shadow-fluffy)] md:block"
          style={{ height: boardHeight, background: 'radial-gradient(rgba(124,92,219,.10) 1.4px, transparent 1.6px) 0 0/26px 26px, linear-gradient(160deg,#FFFFFF,#F3EEFF 70%,#FFEEF4)' }}
        >
          {shown.map((n, i) => {
            const p = posOf(n, i)
            const isDragging = drag?.id === n.id
            return (
              <div
                key={n.id}
                onPointerDown={(e) => startDrag(e, n, i)}
                className="absolute cursor-grab touch-none select-none active:cursor-grabbing"
                style={{
                  width: NOTE_W,
                  left: `calc((100% - ${NOTE_W}px) * ${p.x / 100})`,
                  top: p.y,
                  zIndex: isDragging ? 9999 : n.z ?? 0,
                  transform: `rotate(${isDragging ? 0 : n.rotacion}deg) scale(${isDragging ? 1.06 : 1})`,
                  transition: isDragging ? 'none' : 'transform .3s cubic-bezier(.34,1.56,.64,1)',
                }}
              >
                <NoteCard note={n} mine={n.autor_id === user?.id} uid={user?.id} board onLike={() => like(n)} onToggle={(id) => toggleItem(n, id)} />
              </div>
            )
          })}
        </div>
      )}

      {/* Cuadrícula (celular, o elegida) */}
      <div className={`grid grid-cols-2 gap-x-4 gap-y-7 pt-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 md:gap-x-6 ${view === 'heladera' ? 'md:hidden' : ''}`}>
        {shown.map((n) => (
          <div key={n.id} onClick={() => setEditing(n)} className="cursor-pointer transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:z-10 hover:scale-[1.03]" style={{ transform: `rotate(${n.rotacion}deg)` }}>
            <NoteCard note={n} mine={n.autor_id === user?.id} uid={user?.id} onLike={() => like(n)} onToggle={(id) => toggleItem(n, id)} />
          </div>
        ))}
      </div>

      {editing && (
        <NoteEditor
          note={editing}
          canDelete={editing.autor_id === user?.id}
          onClose={() => { setEditing(null); load() }}
          onSave={(p) => { update(editing.id, p); setEditing(null) }}
          onDelete={() => remove(editing.id)}
        />
      )}
    </Page>
  )
}
