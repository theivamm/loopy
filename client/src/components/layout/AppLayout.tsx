import { NavLink, Outlet } from 'react-router-dom'
import { LoopyMascot } from '../LoopyMascot'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/app', label: 'Inicio', emoji: '🏠', end: true },
  { to: '/app/estados', label: 'Estados', emoji: '💭' },
  { to: '/app/cartas', label: 'Cartas', emoji: '💌' },
  { to: '/app/notitas', label: 'Notitas', emoji: '🗒️' },
  { to: '/app/musica', label: 'Música', emoji: '🎵' },
  { to: '/app/pelis', label: 'Pelis y series', emoji: '🎬' },
  { to: '/app/links', label: 'Links', emoji: '🔗' },
  { to: '/app/calendario', label: 'Calendario', emoji: '📅' },
  { to: '/app/comidas', label: 'Comidas', emoji: '🍝' },
  { to: '/app/ideas', label: 'Ideas', emoji: '✨' },
  { to: '/app/ajustes', label: 'Ajustes', emoji: '⚙️' },
]

const mobileItems = navItems.slice(0, 5)

export function AppLayout() {
  const { space } = useAuth()

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <LoopyMascot size={36} />
          <div>
            <p className="font-display text-lg font-semibold text-ink">loopy</p>
            {space && <p className="text-xs text-ink-muted">{space.nombre}</p>}
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-lilac-mist text-plum' : 'text-ink-soft hover:bg-surface-soft'
                }`
              }
            >
              <span>{item.emoji}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-line bg-surface py-2 md:hidden">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-semibold ${
                isActive ? 'text-plum' : 'text-ink-muted'
              }`
            }
          >
            <span className="text-lg">{item.emoji}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
