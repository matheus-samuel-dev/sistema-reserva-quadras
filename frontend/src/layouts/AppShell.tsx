import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  Gauge,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  Users,
  Volleyball,
  WalletCards
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { NotificationBell } from '../components/NotificationBell';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/reservas', label: 'Reservas', icon: WalletCards },
  { to: '/admin/quadras', label: 'Quadras', icon: Volleyball },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { to: '/admin/comunidade', label: 'Comunidade', icon: Sparkles },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
  { to: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/admin/status', label: 'Status', icon: ShieldCheck }
];

const clientNav = [
  { to: '/app', label: 'Início', icon: Home },
  { to: '/app/reservas', label: 'Reservas', icon: WalletCards },
  { to: '/app/nova-reserva', label: 'Nova', icon: CalendarDays },
  { to: '/app/quadras', label: 'Quadras', icon: Volleyball },
  { to: '/app/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/app/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { to: '/app/estatisticas', label: 'Stats', icon: BarChart3 },
  { to: '/app/comunidade', label: 'Comunidade', icon: Sparkles },
  { to: '/app/ranking', label: 'Ranking', icon: Trophy },
  { to: '/app/parceiros', label: 'Parceiros', icon: Users },
  { to: '/app/campeonatos', label: 'Campeonatos', icon: Activity },
  { to: '/app/ai', label: 'PlaySpace AI', icon: Gauge },
  { to: '/app/perfil', label: 'Perfil', icon: Users }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { state, toggleTheme, finishTour } = useAppData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!user) return null;
  const nav = user.role === 'ADMIN' ? adminNav : clientNav;
  const home = user.role === 'ADMIN' ? '/admin' : '/app';

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = query.toLowerCase();
    return [
      ...state.courts.filter((court) => court.name.toLowerCase().includes(normalized) || court.modality.toLowerCase().includes(normalized)).map((court) => ({ label: court.name, detail: court.modality, to: user.role === 'ADMIN' ? '/admin/quadras' : '/app/quadras' })),
      ...state.reservations.filter((reservation) => reservation.code.toLowerCase().includes(normalized) || reservation.clientName.toLowerCase().includes(normalized)).slice(0, 5).map((reservation) => ({ label: reservation.code, detail: `${reservation.courtName} · ${reservation.status}`, to: user.role === 'ADMIN' ? '/admin/reservas' : '/app/reservas' })),
      ...state.users.filter((candidate) => candidate.name.toLowerCase().includes(normalized)).slice(0, 3).map((candidate) => ({ label: candidate.name, detail: candidate.role, to: user.role === 'ADMIN' ? '/admin/usuarios' : '/app/ranking' }))
    ].slice(0, 8);
  }, [query, state.courts, state.reservations, state.users, user.role]);

  const NavList = (
    <nav className="mt-8 grid gap-1">
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === home}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-neon/15 text-neon' : 'text-muted hover:bg-white/5 hover:text-[var(--text)]'}`
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="glass-panel fixed inset-y-0 left-0 z-30 hidden w-72 flex-col rounded-none border-y-0 border-l-0 p-5 lg:flex">
        <Link to={home} aria-label="PlaySpace home">
          <Logo />
        </Link>
        {NavList}
        <div className="mt-auto rounded-lg border border-line bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-neon/15 text-sm font-black text-neon">{user.profile.photo}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="text-xs text-muted">{user.role === 'ADMIN' ? 'Administrador' : user.profile.level}</p>
            </div>
          </div>
        </div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setDrawerOpen(false)}>
          <aside className="glass-panel h-full w-80 max-w-[84vw] rounded-none border-y-0 border-l-0 p-5" onClick={(event) => event.stopPropagation()}>
            <Logo />
            {NavList}
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line bg-[var(--bg)]/75 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <button className="ghost-button rounded-lg p-2 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                className="w-full rounded-lg border border-line bg-white/[0.04] py-2 pl-10 pr-3 text-sm"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar quadras, reservas, usuários..."
              />
              {results.length > 0 && (
                <div className="glass-panel absolute left-0 right-0 top-12 z-40 rounded-lg p-2">
                  {results.map((item) => (
                    <button
                      key={`${item.label}-${item.detail}`}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-white/5"
                      onClick={() => {
                        navigate(item.to);
                        setQuery('');
                      }}
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-xs text-muted">{item.detail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="ghost-button rounded-lg p-2" onClick={toggleTheme} aria-label="Alternar tema">
              {state.preferences.theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <NotificationBell user={user} />
            <button className="ghost-button rounded-lg p-2" onClick={logout} aria-label="Sair">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="px-4 py-6 pb-24 md:px-6 lg:pb-8">
          {!state.preferences.tourDone && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neon/30 bg-neon/10 p-4">
              <div>
                <p className="font-black">Tour PlaySpace</p>
                <p className="text-sm text-muted">Use a busca global, acesse notificações inteligentes e teste o fluxo de reserva com pagamento demo.</p>
              </div>
              <button className="neon-button rounded-lg px-4 py-2 text-sm font-bold" onClick={finishTour}>Começar</button>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-line bg-[var(--bg)]/92 px-2 py-2 backdrop-blur-xl lg:hidden">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.to === home} className={({ isActive }) => `grid place-items-center gap-1 rounded-lg p-2 text-[11px] font-semibold ${isActive ? 'bg-neon/15 text-neon' : 'text-muted'}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
