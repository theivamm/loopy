import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Chip, Page, PageHeader } from '../../components/ui/PageShell'
import { THREAD_COLORS, DEFAULT_THREAD_COLOR } from '../../lib/threadColors'

export default function Settings() {
  const { profile, space } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const color = THREAD_COLORS[profile?.color_hilo ?? ''] ?? DEFAULT_THREAD_COLOR
  const initial = (profile?.apodo || profile?.email || '?').charAt(0).toUpperCase()
  const plus = space?.plan === 'plus'

  return (
    <Page max={620}>
      <PageHeader icon="ajustes" title="Ajustes" subtitle="Tu perfil y su espacio." />

      <div className="flex flex-col gap-4">
        <div className="card flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full font-display text-3xl font-semibold text-ink shadow-[inset_0_2px_0_rgba(255,255,255,.6),0_6px_16px_rgba(124,92,219,.18)] ring-4 ring-white" style={{ background: color }}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="eyebrow m-0">Perfil</p>
            <p className="m-0 truncate text-lg font-bold text-ink">{profile?.apodo ?? '—'}</p>
            <p className="m-0 truncate text-sm text-ink-soft">{profile?.email}</p>
          </div>
        </div>

        <div className={`card flex items-center gap-4 ${plus ? 'bg-grad-loop' : ''}`}>
          <Icon name={plus ? 'crown' : 'users'} size={56} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow m-0">Espacio</p>
            <p className="m-0 truncate text-lg font-bold text-ink">{space?.nombre}</p>
          </div>
          <Chip tone={plus ? 'butter' : 'lavender'}>{plus ? 'Loopy Plus' : 'Plan gratis'}</Chip>
        </div>

        <Button variant="danger" className="mt-2 w-full sm:w-auto sm:self-start" onClick={handleSignOut}>
          <Icon name="logout" bare size={20} /> Cerrar sesión
        </Button>
      </div>
    </Page>
  )
}
