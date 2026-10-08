import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LoopyMascot } from '../LoopyMascot'
import { Icon, type IconName } from '../ui/Icon'
import { Blobs } from '../ui/Blobs'
import { useAuth } from '../../context/AuthContext'
import { UserStatusMenu } from './UserStatusMenu'
import { PartnerNotifier } from './PartnerNotifier'
import { NotificationMenu } from './NotificationMenu'

interface NavItem { to: string; label: string; icon: IconName; end?: boolean }

const navItems: NavItem[] = [
  { to: '/app', label: 'Inicio', icon: 'home', end: true },
  { to: '/app/estados', label: 'Estados', icon: 'estados' },
  { to: '/app/cartas', label: 'Cartas', icon: 'cartas' },
  { to: '/app/notitas', label: 'Notitas', icon: 'notitas' },
  { to: '/app/musica', label: 'Música', icon: 'musica' },
  { to: '/app/pelis', label: 'Pelis y series', icon: 'pelis' },
  { to: '/app/links', label: 'Links', icon: 'links' },
  { to: '/app/calendario', label: 'Calendario', icon: 'calendario' },
  { to: '/app/comidas', label: 'Comidas', icon: 'comidas' },
  { to: '/app/ideas', label: 'Ideas', icon: 'ideas' },
]

const dockItems = [navItems[0], navItems[2], navItems[4], navItems[7]]
const moreItems = [navItems[1], navItems[3], navItems[5], navItems[6], navItems[8], navItems[9]]
const STORAGE_KEY = 'loopy_sidebar_collapsed'

export function AppLayout() {
  const { space } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')
  const { pathname } = useLocation()
  const moreActive = moreItems.some((i) => pathname.startsWith(i.to)) || pathname.startsWith('/app/ajustes')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const linkCls = (isActive: boolean) =>
    `group flex items-center rounded-full py-1.5 text-sm font-bold no-underline transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
      collapsed ? 'justify-center px-0' : 'gap-3 pl-1.5 pr-4'
    } ${
      isActive
        ? 'bg-gradient-to-r from-lilac-mist to-[#FFE9F1] text-plum shadow-[0_4px_14px_rgba(124,92,219,.14)]'
        : `text-ink-soft hover:bg-white/70 hover:text-plum ${collapsed ? '' : 'hover:translate-x-1'}`
    }`

  return (
    <div className="relative flex min-h-screen">
      <Blobs />

      {/* Sidebar desktop (colapsable) */}
      <aside
        className={`glass sticky top-5 m-5 mr-0 hidden h-[calc(100vh-40px)] shrink-0 flex-col gap-1 rounded-[36px] p-3 shadow-[var(--shadow-fluffy)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex ${
          collapsed ? 'w-[84px]' : 'w-[236px]'
        }`}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="absolute -right-3.5 top-9 z-10 grid h-7 w-7 place-items-center rounded-full bg-white shadow-[0_4px_12px_rgba(124,92,219,.25)] transition-transform hover:scale-110 active:scale-90"
        >
          <Icon name={collapsed ? 'caretRight' : 'caretLeft'} bare size={14} />
        </button>

        <div className={`mb-3 flex items-center pt-1 ${collapsed ? 'justify-center' : 'gap-2.5 px-2'}`}>
          <LoopyMascot size={collapsed ? 40 : 44} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="m-0 font-display text-[22px] font-semibold leading-none text-ink">loopy</p>
              {space && <p className="m-0 mt-1 truncate text-xs text-ink-muted">{space.nombre}</p>}
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} title={collapsed ? item.label : undefined} className={({ isActive }) => linkCls(isActive)}>
              <Icon name={item.icon} size={collapsed ? 44 : 36} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/app/ajustes" title={collapsed ? 'Ajustes' : undefined} className={({ isActive }) => linkCls(isActive)}>
          <Icon name="ajustes" size={collapsed ? 44 : 36} />
          {!collapsed && <span>Ajustes</span>}
        </NavLink>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[76px] shrink-0 items-center gap-3 bg-cream/60 px-4 backdrop-blur-md md:bg-transparent md:px-6 md:backdrop-blur-none">
          <div className="glass flex items-center gap-1.5 rounded-full py-1 pl-1 pr-4 shadow-[var(--shadow-loopy-md)] md:hidden">
            <LoopyMascot size={34} />
            <span className="font-display text-lg font-semibold text-ink">loopy</span>
          </div>
          <div id="topbar-slot" className="hidden min-w-0 flex-1 md:block" />
          <div className="flex-1 md:hidden" />
          <div id="topbar-actions" className="hidden items-center gap-2 md:flex" />
          <UserStatusMenu />
          <NotificationMenu />
        </header>
        <main className="min-w-0 flex-1 pb-28 pt-1 md:pb-10">
          <Outlet />
        </main>
      </div>
      <PartnerNotifier />

      {/* Dock móvil */}
      <nav className="glass pb-safe fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full px-2 pt-2 shadow-[var(--shadow-fluffy-lg)] md:hidden">
        {dockItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `flex min-w-[56px] flex-col items-center gap-0.5 rounded-full px-1 pb-1 text-[11px] font-bold no-underline transition-all ${
                isActive ? 'text-plum' : 'text-ink-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-transform duration-300 ${isActive ? '-translate-y-1 scale-110' : ''}`}>
                  <Icon name={item.icon} size={42} />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-full px-1 pb-1 text-[11px] font-bold ${
            moreActive ? 'text-plum' : 'text-ink-muted'
          }`}
        >
          <Icon name="more" size={42} tone="peach" />
          Más
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="animate-fade absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="animate-sheet pb-safe absolute inset-x-0 bottom-0 rounded-t-[40px] bg-cream px-5 pt-3">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
            <div className="grid grid-cols-3 gap-3 pb-4">
              {[...moreItems, { to: '/app/ajustes', label: 'Ajustes', icon: 'ajustes' as IconName }].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-[28px] bg-white py-4 text-[13px] font-bold text-ink no-underline shadow-[var(--shadow-fluffy)] active:scale-95"
                >
                  <Icon name={item.icon} size={52} />
                  <span className="text-center leading-tight">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
