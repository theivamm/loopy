import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { LetterPaper, Seal } from './LetterPaper'
import { parsePaper } from '../../lib/letterStyle'
import type { Letter } from '../../types/db'

/** Sobre grande con solapa que se abre. */
function BigEnvelope({ color, seal, opening }: { color: string; seal: string; opening: boolean }) {
  return (
    <div className="relative mx-auto h-[210px] w-[300px] max-w-full" style={{ perspective: 900 }}>
      <div className="absolute inset-0 rounded-[22px] shadow-[0_20px_44px_rgba(124,92,219,.28)]" style={{ background: color, filter: 'brightness(.97)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[150px] rounded-b-[22px]" style={{ background: color, clipPath: 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)', filter: 'brightness(.93)' }} />
      <div
        className="absolute inset-x-0 top-0 h-[120px] rounded-t-[22px]"
        style={{
          background: color, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', transformOrigin: 'top',
          animation: opening ? 'loopy-flap .7s ease-in forwards' : undefined, filter: 'brightness(1.02)',
          zIndex: opening ? 0 : 2,
        }}
      />
      {!opening && (
        <div className="absolute left-1/2 top-[88px] z-[3] -translate-x-1/2" style={{ animation: 'loopy-breathe 3s ease-in-out infinite' }}>
          <Seal spec={seal} size={56} />
        </div>
      )}
    </div>
  )
}

interface Props { letter: Letter; mine: boolean; onClose: () => void; onRead: () => void }

export function LetterReader({ letter, mine, onClose, onRead }: Props) {
  const paper = parsePaper(letter.estilo)
  const [stage, setStage] = useState<'sealed' | 'opening' | 'open'>(mine || letter.leida ? 'open' : 'sealed')

  async function openIt() {
    setStage('opening')
    await supabase.from('letters').update({ leida: true }).eq('id', letter.id)
    setTimeout(() => { setStage('open'); onRead() }, 800)
  }

  const seal = letter.decoraciones?.find((d) => d.type === 'seal')?.ref ?? 'lavanda|heart'

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm md:items-center md:p-8" onClick={onClose}>
      <div className="animate-pop relative w-full max-w-[760px]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Cerrar" className="absolute -top-3 right-0 z-10 grid h-11 w-11 place-items-center rounded-full bg-white shadow-[var(--shadow-loopy-md)] transition-transform hover:scale-110 md:-right-3">
          <Icon name="close" bare size={20} />
        </button>

        {stage !== 'open' ? (
          <div className="card flex flex-col items-center gap-6 !py-10 text-center">
            <BigEnvelope color={paper.color} seal={seal} opening={stage === 'opening'} />
            <div>
              <p className="eyebrow m-0">{letter.tipo === 'condicional' ? 'Para cuando…' : 'Carta para vos'}</p>
              <h2 className="m-0 mt-1 text-2xl text-ink">{letter.tipo === 'condicional' && letter.condicion ? `Abrir cuando ${letter.condicion}` : letter.titulo}</h2>
            </div>
            <Button onClick={openIt} disabled={stage === 'opening'}>
              <Icon name="envelopeOpen" bare size={20} tone="lavender" />{stage === 'opening' ? 'Abriendo…' : 'Abrir carta'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="px-1 text-center md:text-left">
              <h2 className="m-0 text-3xl text-white drop-shadow-[0_2px_8px_rgba(46,36,64,.5)]">{letter.titulo}</h2>
              <p className="m-0 mt-1 text-sm font-semibold text-white/90">
                {mine ? 'La escribiste vos' : 'De tu pareja'} · {new Date(letter.creado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <LetterPaper paper={paper} decos={letter.decoraciones ?? []} html={letter.contenido} className="animate-pop" />
          </div>
        )}
      </div>
    </div>
  )
}
