import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoopyMascot } from '../components/LoopyMascot'

export function ProtectedRoute() {
  const { user, space, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <LoopyMascot size={64} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!space) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
