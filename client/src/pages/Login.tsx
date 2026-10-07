import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Button } from '../components/ui/Button'
import { LoopyMascot } from '../components/LoopyMascot'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Uy, se nos enredó el hilo. Revisá tus datos y probá de nuevo.')
      return
    }
    const pendingInvite = sessionStorage.getItem('loopy_pending_invite')
    navigate(pendingInvite ? `/invite/${pendingInvite}` : '/app')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grad-hero px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-xl)] bg-surface p-8 shadow-[var(--shadow-loopy-lg)]">
        <div className="mb-6 flex justify-center">
          <LoopyMascot size={72} />
        </div>
        <h1 className="text-center font-display text-2xl font-semibold text-ink">Bienvenidos de nuevo</h1>
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
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 outline-none focus:ring-2 focus:ring-lavender"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft">
          ¿Todavía no tienen espacio?{' '}
          <Link to="/signup" className="font-semibold text-plum">
            Créenlo acá
          </Link>
        </p>
      </div>
    </div>
  )
}
