import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { AuthShell } from '../components/ui/AuthShell'

type Step = 'checking' | 'needs-auth' | 'joining' | 'celebrating' | 'error'

export default function InviteAccept() {
  const { token = '' } = useParams()
  const { user, space, loading: authLoading, refresh } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (space) {
      navigate('/app', { replace: true })
      return
    }

    if (!user) {
      sessionStorage.setItem('loopy_pending_invite', token)
      setStep('needs-auth')
      return
    }

    async function join() {
      setStep('joining')
      const { error } = await supabase.rpc('accept_invitation', { p_token: token })
      if (error) {
        setError('Esa invitación ya no es válida. Pedí un link nuevo.')
        setStep('error')
        return
      }
      sessionStorage.removeItem('loopy_pending_invite')
      await refresh()
      setStep('celebrating')
      setTimeout(() => navigate('/app', { replace: true }), 2600)
    }

    join()
  }, [authLoading, user, space, token, navigate, refresh])

  if (step === 'needs-auth')
    return (
      <AuthShell title="Te invitaron a su Loopy" subtitle="Creá tu cuenta (o iniciá sesión) para entrar al espacio." expression="waiting">
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/signup')}>Crear cuenta</Button>
          <Button variant="secondary" onClick={() => navigate('/login')}>Ya tengo cuenta</Button>
        </div>
      </AuthShell>
    )

  if (step === 'celebrating')
    return (
      <AuthShell title="¡Nació su Loopy!" subtitle="Bienvenidos a su espacio." expression="celebrating" mascotSize={132}>
        <div />
      </AuthShell>
    )

  if (step === 'error')
    return (
      <AuthShell title="Uy, se nos enredó el hilo" expression="waiting">
        <p className="mt-0 text-center text-error">{error}</p>
        <Button className="w-full" variant="secondary" onClick={() => navigate('/')}>Volver al inicio</Button>
      </AuthShell>
    )

  return (
    <AuthShell title="Entrelazando los hilos…" expression="happy">
      <div />
    </AuthShell>
  )
}
