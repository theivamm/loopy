import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import InvitePage from './pages/InvitePage'
import InviteAccept from './pages/InviteAccept'

import Dashboard from './pages/app/Dashboard'
import Letters from './pages/app/Letters'
import Notes from './pages/app/Notes'
import Settings from './pages/app/Settings'
import ComingSoon from './pages/app/ComingSoon'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/invite/:token" element={<InviteAccept />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/app/invite" element={<InvitePage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="estados" element={<ComingSoon title="Estados" />} />
            <Route path="cartas" element={<Letters />} />
            <Route path="notitas" element={<Notes />} />
            <Route path="musica" element={<ComingSoon title="Música" />} />
            <Route path="pelis" element={<ComingSoon title="Pelis y series" />} />
            <Route path="links" element={<ComingSoon title="Links" />} />
            <Route path="calendario" element={<ComingSoon title="Calendario" />} />
            <Route path="comidas" element={<ComingSoon title="Comidas" />} />
            <Route path="ideas" element={<ComingSoon title="Ideas" />} />
            <Route path="ajustes" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
