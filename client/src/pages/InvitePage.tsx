import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { AuthShell } from '../components/ui/AuthShell'
import { Icon } from '../components/ui/Icon'
import type { Invitation } from '../types/db'
import { usePartner } from '../lib/usePartner'

const pendingInvitations = new Map<string, Promise<Invitation>>()
function getInvitation(spaceId: string) {
  const pending = pendingInvitations.get(spaceId)
  if (pending) return pending
  const request = (async () => {
    const { data: existing, error: queryError } = await supabase.from('invitations').select('*')
      .eq('space_id', spaceId).eq('usado', false).gt('vence_en', new Date().toISOString())
      .order('creado_en', { ascending: false }).limit(1).maybeSingle()
    if (queryError) throw queryError
    if (existing) return existing as Invitation
    const { data, error } = await supabase.rpc('create_invitation', { p_space_id: spaceId })
    if (error || !data) throw error ?? new Error('No se recibió la invitación')
    return data as Invitation
  })().finally(() => pendingInvitations.delete(spaceId))
  pendingInvitations.set(spaceId, request)
  return request
}

export default function InvitePage() {
  const { space, loading: authLoading } = useAuth()
  const spaceId = space?.id
  const { hasPartner, error: partnerError } = usePartner()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!authLoading && hasPartner === true) navigate('/app', { replace: true })
  }, [authLoading, hasPartner, navigate])

  useEffect(() => {
    if (authLoading || !spaceId || hasPartner !== false) return
    let active = true
    getInvitation(spaceId).then((data) => { if (active) { setInvitation(data); setError(null) } })
      .catch((cause: unknown) => {
        if (!active) return
        const detail = cause && typeof cause === 'object' && 'message' in cause ? String(cause.message) : 'Error de conexión con Supabase'
        const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : ''
        setError(`No se pudo preparar la invitación: ${detail}${code ? ` (${code})` : ''}`)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [authLoading, spaceId, hasPartner, attempt])

  const inviteUrl = invitation ? `${window.location.origin}/invite/${invitation.token}` : ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { setError('No se pudo copiar. Seleccioná el link y copialo manualmente.') }
  }

  return (
    <AuthShell
      title="Loopy está esperando a tu otra mitad"
      subtitle="Compartí este link o código para invitarla/o."
      expression="waiting"
      mascotSize={116}
    >
      {loading && !partnerError && <p className="text-center text-ink-muted">Preparando la invitación…</p>}
      {partnerError && <p role="alert" className="text-center text-sm text-error">No pudimos comprobar los integrantes del espacio. Recargá la página para intentar nuevamente.</p>}
      {error && <div role="alert"><p className="text-center text-sm text-error">{error}</p><Button variant="secondary" className="w-full" disabled={loading} onClick={() => { setLoading(true); setError(null); setAttempt((value) => value + 1) }}>Reintentar</Button></div>}

      {invitation && hasPartner === false && (
        <div className="flex flex-col gap-4">
          <div className="rounded-[28px] bg-gradient-to-br from-lilac-mist to-[#FFE9F1] p-4 text-center">
            <p className="eyebrow m-0">Código</p>
            <p className="m-0 mt-1 font-display text-4xl font-semibold tracking-[0.25em] text-plum">{invitation.codigo}</p>
          </div>

          <input readOnly value={inviteUrl} onFocus={(e) => e.target.select()} className="field text-center text-sm text-ink-soft" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" className="flex-1" onClick={copy}>
              <Icon name={copied ? 'check' : 'copy'} bare size={20} />
              {copied ? '¡Copiado!' : 'Copiar link'}
            </Button>
            <a
              className="flex flex-1 no-underline"
              href={`https://wa.me/?text=${encodeURIComponent(`Te invito a nuestro Loopy: ${inviteUrl}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="w-full">
                <Icon name="whatsapp" bare size={20} tone="mint" />
                WhatsApp
              </Button>
            </a>
          </div>

          <p className="m-0 text-center text-xs text-ink-muted">
            Vence el {new Date(invitation.vence_en).toLocaleDateString()}
          </p>
        </div>
      )}
      <Button variant="secondary" className="mt-5 w-full" onClick={() => navigate('/app')}>Volver a mi espacio</Button>
    </AuthShell>
  )
}
