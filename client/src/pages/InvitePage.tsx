import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { LoopyMascot } from '../components/LoopyMascot'
import type { Invitation } from '../types/db'

export default function InvitePage() {
  const { space, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && space) {
      navigate('/app', { replace: true })
    }
  }, [authLoading, space, navigate])

  useEffect(() => {
    async function loadOrCreateInvitation() {
      const { data: membership } = await supabase
        .from('memberships')
        .select('space_id')
        .maybeSingle()

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

      const { data, error } = await supabase.rpc('create_invitation', {
        p_space_id: membership.space_id,
      })
      if (error) setError(error.message)
      else setInvitation(data as Invitation)
      setLoading(false)
    }

    loadOrCreateInvitation()
  }, [])

  const inviteUrl = invitation ? `${window.location.origin}/invite/${invitation.token}` : ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-grad-hero px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-surface p-8 text-center shadow-[var(--shadow-loopy-lg)]">
        <div className="mb-4 flex justify-center">
          <LoopyMascot size={96} expression="waiting" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Loopy está esperando a tu otra mitad 🧶
        </h1>
        <p className="mt-2 text-ink-soft">Compartí este link o código para invitarla/o.</p>

        {loading && <p className="mt-6 text-ink-muted">Preparando la invitación…</p>}
        {error && <p className="mt-6 text-sm text-error">{error}</p>}

        {invitation && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-[var(--radius-md)] bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Código</p>
              <p className="font-display text-3xl font-semibold tracking-widest text-plum">
                {invitation.codigo}
              </p>
            </div>

            <input
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.target.select()}
              className="h-12 rounded-[var(--radius-sm)] bg-surface-soft px-4 text-center text-sm text-ink-soft outline-none"
            />

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
              >
                Copiar link
              </Button>
              <a
                className="flex-1"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Te invito a nuestro Loopy 🧶 ${inviteUrl}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="primary" className="w-full">
                  Enviar por WhatsApp
                </Button>
              </a>
            </div>

            <p className="text-xs text-ink-muted">Vence el {new Date(invitation.vence_en).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}
