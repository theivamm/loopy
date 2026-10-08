import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoopyMascot } from '../components/LoopyMascot'

export function ProtectedRoute() {
  const { user, space, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <LoopyMascot size={64} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (error && !space) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
      <p role="alert" className="text-ink">{error}</p>
      <button onClick={() => window.location.reload()} className="rounded-full bg-plum px-6 py-3 font-bold text-white">Reintentar</button>
    </div>
  )
  if (!space) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
