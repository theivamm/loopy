import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { AuthShell } from '../components/ui/AuthShell'
import { Icon } from '../components/ui/Icon'
import type { Invitation } from '../types/db'

export default function InvitePage() {
  const { space, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && space) navigate('/app', { replace: true })
  }, [authLoading, space, navigate])

  useEffect(() => {
    async function loadOrCreateInvitation() {
      const { data: membership } = await supabase.from('memberships').select('space_id').maybeSingle()

      if (!membership) {
        setLoading(false)
        return
      }

      const { data: existing } = await supabase
        .from('invitations')
        .select('*')
        .eq('space_id', membership.space_id)
        .eq('usado', false)
        .order('creado_en', { ascending: false })
        .maybeSingle()

      if (existing) {
        setInvitation(existing as Invitation)
        setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('create_invitation', { p_space_id: membership.space_id })
      if (error) setError(error.message)
      else setInvitation(data as Invitation)
      setLoading(false)
    }

    loadOrCreateInvitation()
  }, [])

  const inviteUrl = invitation ? `${window.location.origin}/invite/${invitation.token}` : ''

  function copy() {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AuthShell
      title="Loopy está esperando a tu otra mitad"
      subtitle="Compartí este link o código para invitarla/o."
      expression="waiting"
      mascotSize={116}
    >
      {loading && <p className="text-center text-ink-muted">Preparando la invitación…</p>}
      {error && <p className="text-center text-sm text-error">{error}</p>}

      {invitation && (
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
    </AuthShell>
  )
}
