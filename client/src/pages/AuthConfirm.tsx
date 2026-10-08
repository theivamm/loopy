import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthShell } from '../components/ui/AuthShell'

export default function AuthConfirm() {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const [confirmationError] = useState(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    return hash.has('error') || hash.has('error_code') || params.has('error')
  })
  const invite = params.get('invite') || sessionStorage.getItem('loopy_pending_invite')
  if (loading) return <AuthShell title="Confirmando tu cuenta…" expression="happy"><p className="text-center text-ink-soft">Estamos preparando tu Loopy.</p></AuthShell>
  if (user && !confirmationError) return <Navigate replace to={invite ? `/invite/${encodeURIComponent(invite)}` : '/app'} />
  return <AuthShell title={confirmationError ? 'El enlace ya no es válido' : 'Continuá en Loopy'} expression="waiting">
    <p className="text-center text-ink-soft">{confirmationError ? 'El enlace venció o ya fue utilizado. Si confirmaste tu cuenta, podés iniciar sesión.' : 'Iniciá sesión con tu email y contraseña para continuar.'}</p>
    <Link to="/login" className="block rounded-full bg-plum px-5 py-3 text-center font-bold text-white no-underline" onClick={() => { if (invite) sessionStorage.setItem('loopy_pending_invite', invite) }}>Ir a iniciar sesión</Link>
  </AuthShell>
}
