import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'

export default function Settings() {
  const { profile, space } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-[600px] p-6 md:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Ajustes</h1>

      <div className="mt-6 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-loopy-sm)]">
        <p className="text-sm font-semibold text-ink-muted">Perfil</p>
        <p className="mt-1 text-ink">{profile?.apodo ?? '—'}</p>
        <p className="text-sm text-ink-soft">{profile?.email}</p>
      </div>

      <div className="mt-4 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-loopy-sm)]">
        <p className="text-sm font-semibold text-ink-muted">Espacio</p>
        <p className="mt-1 text-ink">{space?.nombre}</p>
        <p className="text-sm text-ink-soft">Plan {space?.plan === 'plus' ? 'Loopy Plus' : 'Gratis'}</p>
      </div>

      <Button variant="secondary" className="mt-6" onClick={handleSignOut}>
        Cerrar sesión
      </Button>
    </div>
  )
}
