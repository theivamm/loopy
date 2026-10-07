import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { LoopyMascot } from '../components/LoopyMascot'

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-grad-hero px-4 text-center">
      <div className="w-full max-w-sm rounded-[var(--radius-xl)] bg-surface p-8 shadow-[var(--shadow-loopy-lg)]">
        {step === 'needs-auth' && (
          <>
            <LoopyMascot size={88} expression="waiting" />
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
              Te invitaron a su Loopy
            </h1>
            <p className="mt-2 text-ink-soft">Creá tu cuenta (o iniciá sesión) para entrar al espacio.</p>
            <div className="mt-6 flex flex-col gap-3">
              <Button variant="primary" onClick={() => navigate('/signup')}>
                Crear cuenta
              </Button>
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Ya tengo cuenta
              </Button>
            </div>
          </>
        )}

        {(step === 'checking' || step === 'joining') && (
          <>
            <LoopyMascot size={88} />
            <p className="mt-4 text-ink-soft">Entrelazando los hilos…</p>
          </>
        )}

        {step === 'celebrating' && (
          <>
            <LoopyMascot size={110} expression="celebrating" />
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
              ¡Nació su Loopy! 🎉
            </h1>
            <p className="mt-2 text-ink-soft">Bienvenidos a su espacio.</p>
          </>
        )}

        {step === 'error' && (
          <>
            <LoopyMascot size={88} expression="waiting" />
            <p className="mt-4 text-error">{error}</p>
            <Button className="mt-6" variant="secondary" onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
