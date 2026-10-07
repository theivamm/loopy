import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { LoopyMascot } from '../components/LoopyMascot'

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
      <div className="flex min-h-screen items-center justify-center bg-grad-hero">
        <LoopyMascot size={64} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grad-hero px-4 text-center">
        <div className="w-full max-w-sm rounded-[var(--radius-xl)] bg-surface p-8 shadow-[var(--shadow-loopy-lg)]">
          <div className="mb-6 flex justify-center">
            <LoopyMascot size={72} expression="waiting" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Iniciá sesión primero</h1>
          <p className="mt-2 text-ink-soft">
            Si acabás de registrarte, confirmá tu email y después iniciá sesión para seguir.
          </p>
          <Link to="/login">
            <Button variant="primary" className="mt-6 w-full">
              Ir a iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grad-hero px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-surface p-8 shadow-[var(--shadow-loopy-lg)]">
        <div className="mb-6 flex justify-center">
          <LoopyMascot size={72} colorA={COLORS.find((c) => c.key === colorHilo)?.hex} />
        </div>
        <h1 className="text-center font-display text-2xl font-semibold text-ink">
          Un par de cositas antes de empezar
        </h1>
        <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
            Tu apodo
            <input
              required
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
              placeholder="¿Cómo te dicen?"
              className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 font-normal text-ink outline-none focus:ring-2 focus:ring-lavender"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
            Elegí tu color de hilo 🧶
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setColorHilo(c.key)}
                  className={`h-9 w-9 rounded-full transition-transform ${
                    colorHilo === c.key ? 'scale-110 ring-2 ring-offset-2 ring-plum' : ''
                  }`}
                  style={{ background: c.hex }}
                  aria-label={c.key}
                />
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
            Nombre de su espacio
            <input
              required
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="Juli & Tomi"
              className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 font-normal text-ink outline-none focus:ring-2 focus:ring-lavender"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
            Fecha de aniversario (opcional)
            <input
              type="date"
              value={aniversario}
              onChange={(e) => setAniversario(e.target.value)}
              className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 font-normal text-ink outline-none focus:ring-2 focus:ring-lavender"
            />
          </label>

          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creando su espacio…' : 'Crear su espacio'}
          </Button>
        </form>
      </div>
    </div>
  )
}
