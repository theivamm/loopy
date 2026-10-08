import { Link } from 'react-router-dom'
import { usePartner } from '../../lib/usePartner'
import { Icon } from '../ui/Icon'

export function PartnerInviteBanner() {
  const { hasPartner, error } = usePartner()
  if (hasPartner === true || (hasPartner === null && !error)) return null
  return (
    <aside className="mx-4 mb-4 flex flex-wrap items-center gap-3 rounded-[26px] bg-gradient-to-r from-lilac-mist to-[#FFE9F1] p-4 shadow-[var(--shadow-loopy-md)] md:mx-6" aria-label="Invitar a tu pareja">
      <Icon name="users" size={42} />
      <div className="min-w-0 flex-1"><p className="m-0 font-bold text-ink">{error ? 'Conectá con tu pareja' : 'Todavía falta tu otra mitad'}</p><p className="m-0 text-sm text-ink-soft">{error ? 'No pudimos comprobar si tu pareja ya se unió. Revisá tu espacio desde la invitación.' : 'Compartí una invitación para empezar a usar su Loopy juntos.'}</p></div>
      <Link to="/app/invite" className="rounded-full bg-plum px-5 py-3 text-sm font-bold text-white no-underline">Invitar a tu pareja</Link>
    </aside>
  )
}
