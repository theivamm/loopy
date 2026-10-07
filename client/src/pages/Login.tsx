import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Button } from '../components/ui/Button'
import { AuthShell } from '../components/ui/AuthShell'

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
    <AuthShell title="Bienvenidos de nuevo" subtitle="Su rincón los estaba esperando." expression="happy">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
        <input type="password" required placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
        {error && <p className="m-0 rounded-2xl bg-[#FFE6EA] px-4 py-2 text-sm text-error">{error}</p>}
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </Button>
      </form>
      <p className="mb-0 mt-5 text-center text-sm text-ink-soft">
        ¿Todavía no tienen espacio?{' '}
        <Link to="/signup" className="font-bold text-plum no-underline hover:underline">Créenlo acá</Link>
      </p>
    </AuthShell>
  )
}
