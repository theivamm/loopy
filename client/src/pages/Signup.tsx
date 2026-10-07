import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Button } from '../components/ui/Button'
import { LoopyMascot } from '../components/LoopyMascot'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError('Uy, se nos enredó el hilo. Probá de nuevo.')
      return
    }

    if (!data.session) {
      // email confirmation is required before a session exists
      setNeedsConfirmation(true)
      return
    }

    const pendingInvite = sessionStorage.getItem('loopy_pending_invite')
    navigate(pendingInvite ? `/invite/${pendingInvite}` : '/onboarding')
  }

  if (needsConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grad-hero px-4 text-center">
        <div className="w-full max-w-sm rounded-[var(--radius-xl)] bg-surface p-8 shadow-[var(--shadow-loopy-lg)]">
          <div className="mb-6 flex justify-center">
            <LoopyMascot size={72} expression="waiting" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Revisá tu email</h1>
          <p className="mt-2 text-ink-soft">
            Te mandamos un link a <strong>{email}</strong> para confirmar tu cuenta. Una vez
            confirmada, iniciá sesión para seguir.
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
    <div className="flex min-h-screen items-center justify-center bg-grad-hero px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-xl)] bg-surface p-8 shadow-[var(--shadow-loopy-lg)]">
        <div className="mb-6 flex justify-center">
          <LoopyMascot size={72} expression="celebrating" />
        </div>
        <h1 className="text-center font-display text-2xl font-semibold text-ink">Creemos su espacio</h1>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creando…' : 'Crear cuenta'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft">
          ¿Ya tienen cuenta?{' '}
          <Link to="/login" className="font-semibold text-plum">
            Inicien sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
