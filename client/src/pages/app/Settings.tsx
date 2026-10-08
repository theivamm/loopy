import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Chip, Page, PageHeader } from '../../components/ui/PageShell'
import { THREAD_COLORS, DEFAULT_THREAD_COLOR } from '../../lib/threadColors'
import { currentSubscription, disablePush, enablePush, isIOS, isStandalone, pushSupported, sendTestPush } from '../../lib/push'
import type { NotificationPrefs } from '../../types/db'

type PrefKey = 'toques' | 'reacciones' | 'estados' | 'cartas' | 'notitas' | 'eventos'
const PREFS: { key: PrefKey; label: string; desc: string; icon: IconName }[] = [
  { key: 'toques', label: 'Toques y mensajitos', desc: '“Pensando en vos”, “Te extraño”…', icon: 'heart' },
  { key: 'reacciones', label: 'Reacciones', desc: 'Abrazos, ánimo, cafecitos.', icon: 'hug' },
  { key: 'estados', label: 'Cambios de estado', desc: 'Cuando tu pareja cambia de ánimo.', icon: 'estados' },
  { key: 'cartas', label: 'Cartas', desc: 'Nuevas y las que se desbloquean.', icon: 'cartas' },
  { key: 'notitas', label: 'Notitas', desc: 'Cuando tu pareja pega una en la heladera.', icon: 'notitas' },
  { key: 'eventos', label: 'Eventos', desc: 'Recordatorios de planes (próximamente).', icon: 'calendario' },
]
const DEFAULT_PREFS: Omit<NotificationPrefs, 'user_id'> = { toques: true, reacciones: true, estados: true, cartas: true, notitas: true, eventos: true }

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 ${on ? 'bg-plum' : 'bg-[#E4DDEB]'}`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(46,36,64,.25)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

export default function Settings() {
  const { profile, space, user } = useAuth()
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState(false)
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default')
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!pushSupported()) { setPerm('unsupported'); return }
    setPerm(Notification.permission)
    currentSubscription().then((s) => setEnabled(Boolean(s)))
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('notification_prefs').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setPrefs({ ...DEFAULT_PREFS, ...(data as NotificationPrefs) })
    })
  }, [user])

  async function toggleMaster(on: boolean) {
    if (!user) return
    setBusy(true); setMsg(null)
    if (on) {
      const r = await enablePush(user.id, space?.id ?? null)
      setPerm(pushSupported() ? Notification.permission : 'unsupported')
      if (r === 'ok') { setEnabled(true); setMsg('¡Listo! Las notificaciones están activadas en este dispositivo.') }
      else if (r === 'denied') setMsg('El navegador bloqueó los permisos. Activalos desde la configuración del sitio.')
      else if (r === 'nokey') setMsg('Falta configurar VITE_VAPID_PUBLIC_KEY en el cliente.')
      else if (r === 'unsupported') setMsg('Este navegador no soporta notificaciones push.')
      else setMsg('No se pudo activar. Probá de nuevo.')
    } else {
      await disablePush()
      setEnabled(false)
    }
    setBusy(false)
  }

  async function setPref(key: PrefKey, v: boolean) {
    if (!user) return
    const next = { ...prefs, [key]: v }
    setPrefs(next)
    await supabase.from('notification_prefs').upsert({ user_id: user.id, ...next, actualizado_en: new Date().toISOString() }, { onConflict: 'user_id' })
  }

  async function test() {
    setBusy(true)
    const ok = await sendTestPush()
    setMsg(ok ? 'Te mandamos una notificación de prueba.' : 'No se pudo enviar la prueba. Revisá que el servidor tenga las claves VAPID.')
    setBusy(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const color = THREAD_COLORS[profile?.color_hilo ?? ''] ?? DEFAULT_THREAD_COLOR
  const initial = (profile?.apodo || profile?.email || '?').charAt(0).toUpperCase()
  const plus = space?.plan === 'plus'
  const needsInstall = isIOS() && !isStandalone()

  return (
    <Page max={1100}>
      <PageHeader icon="ajustes" title="Ajustes" subtitle="Tu perfil, su espacio y los avisos." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-6">
          <div className="card flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full font-display text-3xl font-semibold text-ink shadow-[inset_0_2px_0_rgba(255,255,255,.6),0_6px_16px_rgba(124,92,219,.18)] ring-4 ring-white" style={{ background: color }}>{initial}</div>
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

          <Button variant="danger" className="w-full sm:w-auto sm:self-start" onClick={handleSignOut}>
            <Icon name="logout" bare size={20} /> Cerrar sesión
          </Button>
        </div>

        <section className="card flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Icon name="bell" size={56} />
            <div className="min-w-0 flex-1">
              <h2 className="m-0 text-xl text-ink">Notificaciones</h2>
              <p className="m-0 text-sm text-ink-soft">Enterate al instante, incluso con la app cerrada.</p>
            </div>
            <Switch on={enabled} onChange={toggleMaster} label="Activar notificaciones" />
          </div>

          {perm === 'unsupported' && <p className="m-0 rounded-[22px] bg-[#FFF3D6] px-5 py-3 text-sm font-semibold text-ink">Este navegador no soporta push.</p>}
          {perm === 'denied' && <p className="m-0 rounded-[22px] bg-[#FFE6EA] px-5 py-3 text-sm font-semibold text-ink">Bloqueaste las notificaciones en el navegador. Activalas desde el candado de la barra de direcciones.</p>}
          {needsInstall && <p className="m-0 rounded-[22px] bg-[#EAF4FF] px-5 py-3 text-sm font-semibold text-ink">En iPhone primero tocá Compartir → “Agregar a pantalla de inicio” y abrí Loopy desde ahí.</p>}
          {msg && <p className="m-0 rounded-[22px] bg-lilac-mist px-5 py-3 text-sm font-semibold text-plum">{msg}</p>}

          <ul className={`m-0 flex list-none flex-col gap-2 p-0 transition-opacity ${enabled ? '' : 'pointer-events-none opacity-50'}`}>
            {PREFS.map((p) => (
              <li key={p.key} className="flex items-center gap-4 rounded-[26px] bg-surface-soft py-2.5 pl-2.5 pr-5">
                <Icon name={p.icon} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-bold text-ink">{p.label}</p>
                  <p className="m-0 text-xs text-ink-soft">{p.desc}</p>
                </div>
                <Switch on={prefs[p.key]} onChange={(v) => setPref(p.key, v)} label={p.label} />
              </li>
            ))}
          </ul>

          <Button variant="secondary" onClick={test} disabled={!enabled || busy} className="self-start">
            <Icon name="bell" bare size={18} /> Enviarme una de prueba
          </Button>
        </section>
      </div>
    </Page>
  )
}
