import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../ui/Button'

export function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function remove() {
    if (busy || confirmation !== 'ELIMINAR') return
    setBusy(true); setError(null)
    try {
      const api = import.meta.env.VITE_API_URL as string | undefined
      if (!api) throw new Error('No está configurado el servidor. Contactá al administrador.')
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error('Tu sesión venció. Volvé a iniciar sesión.')
      const response = await fetch(`${api}/api/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ confirmation }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || result?.ok !== true) throw new Error(result?.error ?? `No se pudo eliminar la cuenta (HTTP ${response.status}).`)
      await supabase.auth.signOut({ scope: 'local' })
      sessionStorage.removeItem('loopy_pending_invite')
      window.location.replace('/')
    } catch (cause) {
      setError(cause instanceof TypeError ? 'No se pudo conectar con el servidor. Comprobá si la cuenta sigue activa antes de reintentar.' : cause instanceof Error ? cause.message : 'No se pudo eliminar la cuenta.')
    } finally { setBusy(false) }
  }
  return <section className="card flex flex-col gap-3 border border-[#FFD0DA]">
    <h2 className="m-0 text-lg text-ink">Tu cuenta</h2>
    {!open ? <><p className="m-0 text-sm text-ink-soft">Podés eliminar tu cuenta de Loopy cuando quieras.</p><Button variant="danger" className="self-start" onClick={() => setOpen(true)}>Eliminar mi cuenta</Button></> : <>
      <p className="m-0 text-sm text-ink-soft">Se borrarán tu cuenta, perfil, estados, respuestas, preferencias y archivos subidos. Si tu pareja sigue en Loopy, conservará el espacio y el contenido compartido sin tu autoría; tus ideas privadas se borrarán. Si estás solo, se eliminará todo el espacio. Esta acción es permanente.</p>
      <label className="text-sm font-bold text-ink">Escribí ELIMINAR para confirmar<input className="field mt-2 w-full" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" /></label>
      {error && <p role="alert" className="m-0 text-sm text-error">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} onClick={() => { setOpen(false); setConfirmation(''); setError(null) }}>Cancelar</Button><Button variant="danger" disabled={busy || confirmation !== 'ELIMINAR'} onClick={() => { void remove() }}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</Button></div>
    </>}
  </section>
}
