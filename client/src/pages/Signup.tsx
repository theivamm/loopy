import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Button } from '../components/ui/Button'
import { AuthShell } from '../components/ui/AuthShell'

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
      setNeedsConfirmation(true)
      return
    }

    const pendingInvite = sessionStorage.getItem('loopy_pending_invite')
    navigate(pendingInvite ? `/invite/${pendingInvite}` : '/onboarding')
  }

  if (needsConfirmation) {
    return (
      <AuthShell title="Revisá tu email" expression="waiting">
        <p className="mt-0 text-center text-ink-soft">
          Te mandamos un link a <strong className="text-ink">{email}</strong> para confirmar tu cuenta. Una vez
          confirmada, iniciá sesión para seguir.
        </p>
        <Link to="/login" className="no-underline">
          <Button className="mt-4 w-full">Ir a iniciar sesión</Button>
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Creemos su espacio" subtitle="Dos vidas, un mismo lazo." expression="celebrating">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
        <input type="password" required minLength={6} placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
        {error && <p className="m-0 rounded-2xl bg-[#FFE6EA] px-4 py-2 text-sm text-error">{error}</p>}
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="mb-0 mt-5 text-center text-sm text-ink-soft">
        ¿Ya tienen cuenta?{' '}
        <Link to="/login" className="font-bold text-plum no-underline hover:underline">Inicien sesión</Link>
      </p>
    </AuthShell>
  )
}
