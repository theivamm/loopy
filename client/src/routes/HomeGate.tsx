import { Capacitor } from '@capacitor/core'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoopyMascot } from '../components/LoopyMascot'
import Landing from '../pages/Landing'
import AppWelcome, { WELCOME_SEEN_KEY } from '../pages/AppWelcome'

/**
 * Decides what "/" renders. Web visitors always get the marketing Landing
 * page. Inside the native app, that page is redundant (whoever opens it
 * already installed Loopy), so it's replaced with a short welcome carousel
 * on first open, then skipped straight to login/dashboard after that.
 */
export function HomeGate() {
  const { user, loading } = useAuth()

  if (!Capacitor.isNativePlatform()) return <Landing />

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <LoopyMascot size={64} />
      </div>
    )
  }

  if (user) return <Navigate to="/app" replace />

  let seenWelcome = false
  try {
    seenWelcome = localStorage.getItem(WELCOME_SEEN_KEY) === '1'
  } catch {
    // if storage is unavailable, just show the carousel every time
  }

  if (!seenWelcome) return <AppWelcome />

  return <Navigate to="/login" replace />
}
