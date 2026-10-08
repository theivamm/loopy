import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { HomeGate } from './routes/HomeGate'
import { AppLayout } from './components/layout/AppLayout'

import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import InvitePage from './pages/InvitePage'
import InviteAccept from './pages/InviteAccept'
import AuthConfirm from './pages/AuthConfirm'

import Dashboard from './pages/app/Dashboard'
import Estados from './pages/app/Estados'
import Letters from './pages/app/Letters'
import Notes from './pages/app/Notes'
import Songs from './pages/app/Songs'
import Movies from './pages/app/Movies'
import Links from './pages/app/Links'
import Events from './pages/app/Events'
import Meals from './pages/app/Meals'
import Ideas from './pages/app/Ideas'
import Settings from './pages/app/Settings'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeGate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/invite/:token" element={<InviteAccept />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/app/invite" element={<InvitePage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="estados" element={<Estados />} />
            <Route path="cartas" element={<Letters />} />
            <Route path="notitas" element={<Notes />} />
            <Route path="musica" element={<Songs />} />
            <Route path="pelis" element={<Movies />} />
            <Route path="links" element={<Links />} />
            <Route path="calendario" element={<Events />} />
            <Route path="comidas" element={<Meals />} />
            <Route path="ideas" element={<Ideas />} />
            <Route path="ajustes" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
