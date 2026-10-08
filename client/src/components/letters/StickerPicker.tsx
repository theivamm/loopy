import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Icon, type IconName } from '../ui/Icon'
import { Seal } from './LetterPaper'
import { SEAL_COLORS, STICKER_ICONS, type Deco } from '../../lib/letterStyle'

type Add = (d: Omit<Deco, 'id' | 'x' | 'y' | 'rot'> & { size?: number }) => void

async function resizeToBlob(file: File, max = 512): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/webp', 0.9))
}

export function StickerPicker({ onAdd }: { onAdd: Add }) {
  const { space } = useAuth()
  const [tab, setTab] = useState<'stickers' | 'sellos' | 'mias'>('stickers')
  const [mine, setMine] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadMine() {
    if (!space) return
    const { data } = await supabase.storage.from('letter-assets').list(space.id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
    setMine((data ?? []).filter((f) => f.name).map((f) => supabase.storage.from('letter-assets').getPublicUrl(`${space.id}/${f.name}`).data.publicUrl))
  }
  useEffect(() => { if (tab === 'mias') loadMine() }, [tab, space])

  async function upload(file: File) {
    if (!space) return
    setErr(null)
    if (!file.type.startsWith('image/')) { setErr('Elegí una imagen.'); return }
    if (file.size > 8 * 1024 * 1024) { setErr('Máximo 8 MB.'); return }
    setBusy(true)
    try {
      const blob = await resizeToBlob(file)
      const path = `${space.id}/${crypto.randomUUID()}.webp`
      const { error } = await supabase.storage.from('letter-assets').upload(path, blob, { contentType: 'image/webp' })
      if (error) throw error
      const url = supabase.storage.from('letter-assets').getPublicUrl(path).data.publicUrl
      await loadMine()
      onAdd({ type: 'image', ref: url, size: 120 })
    } catch {
      setErr('No se pudo subir. Probá de nuevo.')
    }
    setBusy(false)
  }

  const tabBtn = (k: typeof tab, label: string) => (
    <button type="button" onClick={() => setTab(k)} className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-all ${tab === k ? 'bg-white text-plum shadow-[var(--shadow-loopy-sm)]' : 'text-ink-muted'}`}>{label}</button>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-full bg-surface-soft p-1">{tabBtn('stickers', 'Stickers')}{tabBtn('sellos', 'Sellos')}{tabBtn('mias', 'Mis imágenes')}</div>

      {tab === 'stickers' && (
        <div className="grid grid-cols-5 gap-2">
          {STICKER_ICONS.map((n) => (
            <button key={n} type="button" onClick={() => onAdd({ type: 'icon', ref: n, size: 64 })} className="grid place-items-center rounded-[20px] p-1 transition-transform hover:scale-110 active:scale-90" aria-label={`Agregar ${n}`}>
              <Icon name={n as IconName} size={46} />
            </button>
          ))}
        </div>
      )}

      {tab === 'sellos' && (
        <div className="grid grid-cols-5 gap-3">
          {Object.keys(SEAL_COLORS).flatMap((c) =>
            (['heart', 'sparkle'] as const).map((i) => (
              <button key={`${c}|${i}`} type="button" onClick={() => onAdd({ type: 'seal', ref: `${c}|${i}`, size: 72 })} className="grid place-items-center transition-transform hover:scale-110 active:scale-90" aria-label={`Sello ${c}`}>
                <Seal spec={`${c}|${i}`} size={46} />
              </button>
            )),
          )}
        </div>
      )}

      {tab === 'mias' && (
        <div className="flex flex-col gap-3">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-sky bg-[#F2F8FF] py-5 text-sm font-bold text-[#3B84D9] transition-colors hover:bg-[#E6F1FF]">
            <Icon name="upload" size={34} />{busy ? 'Subiendo…' : 'Subir imagen o sticker'}
          </button>
          {err && <p className="m-0 text-sm text-error">{err}</p>}
          {mine.length === 0 ? (
            <p className="m-0 text-center text-sm text-ink-muted">Todavía no subieron imágenes. Fotos, dibujos o stickers PNG con fondo transparente funcionan genial.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {mine.map((u) => (
                <button key={u} type="button" onClick={() => onAdd({ type: 'image', ref: u, size: 120 })} className="aspect-square overflow-hidden rounded-[16px] bg-surface-soft transition-transform hover:scale-105 active:scale-95">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
