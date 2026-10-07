import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { AuthShell } from '../components/ui/AuthShell'
import { LoopyMascot } from '../components/LoopyMascot'
import { Blobs } from '../components/ui/Blobs'

const COLORS = [
  { key: 'lavender', hex: '#C9B8FF' },
  { key: 'peach', hex: '#FFC2A8' },
  { key: 'blush', hex: '#FFB8D1' },
  { key: 'mint', hex: '#B5EAD7' },
  { key: 'butter', hex: '#FFE8A3' },
  { key: 'sky', hex: '#B8DCFF' },
] as const

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, loading: authLoading, refresh } = useAuth()
  const [apodo, setApodo] = useState('')
  const [colorHilo, setColorHilo] = useState<(typeof COLORS)[number]['key']>('lavender')
  const [spaceName, setSpaceName] = useState('')
  const [aniversario, setAniversario] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setError('Tu sesión no está activa todavía. Confirmá tu email e iniciá sesión de nuevo.')
      return
    }
    setError(null)
    setLoading(true)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ apodo, color_hilo: colorHilo })
      .eq('id', user.id)

    if (profileError) {
      setError('Uy, se nos enredó el hilo. Probá de nuevo.')
      setLoading(false)
      return
    }

    const { error: spaceError } = await supabase.rpc('create_space', {
      p_nombre: spaceName,
      p_fecha_aniversario: aniversario || null,
    })

    setLoading(false)

    if (spaceError) {
      setError('Uy, se nos enredó el hilo. Probá de nuevo.')
      return
    }

    await refresh()
    navigate('/app/invite')
  }

  if (authLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <Blobs />
        <LoopyMascot size={96} />
      </div>
    )
  }

  if (!user) {
    return (
      <AuthShell title="Iniciá sesión primero" expression="waiting">
        <p className="mt-0 text-center text-ink-soft">
          Si acabás de registrarte, confirmá tu email y después iniciá sesión para seguir.
        </p>
        <Link to="/login" className="no-underline">
          <Button className="mt-4 w-full">Ir a iniciar sesión</Button>
        </Link>
      </AuthShell>
    )
  }

  const hex = COLORS.find((c) => c.key === colorHilo)?.hex

  return (
    <AuthShell
      title="Un par de cositas antes de empezar"
      subtitle="Tu hilo de color será parte de su Loopy."
      colorA={hex}
      maxWidth={480}
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-bold text-ink-soft">
          Tu apodo
          <input required value={apodo} onChange={(e) => setApodo(e.target.value)} placeholder="¿Cómo te dicen?" className="field font-normal" />
        </label>

        <div className="flex flex-col gap-2 text-sm font-bold text-ink-soft">
          Elegí tu color de hilo
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c.key}
                onClick={() => setColorHilo(c.key)}
                className={`h-11 w-11 rounded-full shadow-[inset_0_2px_0_rgba(255,255,255,.7),0_4px_10px_rgba(124,92,219,.15)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  colorHilo === c.key ? 'scale-110 ring-[3px] ring-white outline outline-[3px] outline-plum' : 'hover:scale-105'
                }`}
                style={{ background: c.hex }}
                aria-label={c.key}
              />
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2 text-sm font-bold text-ink-soft">
          Nombre de su espacio
          <input required value={spaceName} onChange={(e) => setSpaceName(e.target.value)} placeholder="Juli & Tomi" className="field font-normal" />
        </label>

        <label className="flex flex-col gap-2 text-sm font-bold text-ink-soft">
          Fecha de aniversario (opcional)
          <input type="date" value={aniversario} onChange={(e) => setAniversario(e.target.value)} className="field font-normal" />
        </label>

        {error && <p className="m-0 rounded-2xl bg-[#FFE6EA] px-4 py-2 text-sm text-error">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creando su espacio…' : 'Crear su espacio'}
        </Button>
      </form>
    </AuthShell>
  )
}
