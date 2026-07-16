import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Gauge,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  UserCircle,
  Users,
  Volleyball,
  WalletCards,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { IconField } from '../components/IconField';
import { Logo } from '../components/Logo';
import { NotificationBell } from '../components/NotificationBell';
import { Toast } from '../components/Toast';
import { Tooltip } from '../components/Tooltip';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/reservas', label: 'Reservas', icon: WalletCards },
  { to: '/admin/quadras', label: 'Quadras', icon: Volleyball },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { to: '/admin/comunidade', label: 'Comunidade', icon: Sparkles },
  { to: '/admin/campeonatos', label: 'Campeonatos', icon: Trophy },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
  { to: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/admin/status', label: 'Status', icon: ShieldCheck }
];

const clientNav = [
  { to: '/app', label: 'Início', icon: Home },
  { to: '/app/reservas', label: 'Reservas', icon: WalletCards },
  { to: '/app/nova-reserva', label: 'Nova reserva', icon: CalendarDays },
  { to: '/app/quadras', label: 'Quadras', icon: Volleyball },
  { to: '/app/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/app/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { to: '/app/estatisticas', label: 'Estatísticas', icon: BarChart3 },
  { to: '/app/comunidade', label: 'Comunidade', icon: Sparkles },
  { to: '/app/ranking', label: 'Ranking', icon: Trophy },
  { to: '/app/parceiros', label: 'Parceiros', icon: Users },
  { to: '/app/campeonatos', label: 'Campeonatos', icon: Activity },
  { to: '/app/ai', label: 'PlaySpace AI', icon: Gauge },
  { to: '/app/perfil', label: 'Perfil', icon: UserCircle }
];

type SearchResult = { id: string; group: string; label: string; detail: string; to: string };
const SIDEBAR_KEY = 'playspace-sidebar-collapsed';
const DEMO_NOTICE_KEY = 'playspace-demo-notice-read-v1';

const avatarSrc = (value: string) => /^(https?:|data:|blob:|\/)/.test(value) ? value : undefined;

export function AppShell() {
  const { user, logout, switchAccount, sessionSource } = useAuth();
  const { state, toggleTheme, finishTour, connectionError } = useAppData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const [profileAnchor, setProfileAnchor] = useState<'sidebar' | 'header' | null>(null);
  const [switching, setSwitching] = useState(false);
  const [toast, setToast] = useState('');
  const [toastTone, setToastTone] = useState<'success' | 'danger'>('success');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [demoNoticeOpen, setDemoNoticeOpen] = useState(() => sessionSource === 'demo' && localStorage.getItem(DEMO_NOTICE_KEY) !== 'true');
  const searchRef = useRef<HTMLInputElement>(null);
  const sidebarProfileRef = useRef<HTMLDivElement>(null);
  const headerProfileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    setDemoNoticeOpen(sessionSource === 'demo' && localStorage.getItem(DEMO_NOTICE_KEY) !== 'true');
  }, [sessionSource]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !typing)) {
        event.preventDefault();
        if (window.innerWidth < 640) setMobileSearchOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 0);
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setMobileSearchOpen(false);
        setSearchOpen(false);
        setProfileAnchor(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => {
    const closeProfile = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!sidebarProfileRef.current?.contains(target) && !headerProfileRef.current?.contains(target)) setProfileAnchor(null);
      if (target instanceof Element && !target.closest('[data-global-search]')) setSearchOpen(false);
    };
    document.addEventListener('pointerdown', closeProfile);
    return () => document.removeEventListener('pointerdown', closeProfile);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (!user || debouncedQuery.length < 2) return [];
    const normalized = debouncedQuery.toLocaleLowerCase('pt-BR');
    const isAdmin = user.role === 'ADMIN';
    const result: SearchResult[] = [];
    const visibleReservationIds = isAdmin
      ? null
      : new Set(state.reservations.filter((reservation) => reservation.clientId === user.id).map((reservation) => reservation.id));

    state.courts
      .filter((court) => `${court.name} ${court.modality} ${court.location}`.toLocaleLowerCase('pt-BR').includes(normalized))
      .slice(0, 5)
      .forEach((court) => result.push({ id: `court-${court.id}`, group: 'Quadras', label: court.name, detail: `${court.modality} · ${court.status}`, to: isAdmin ? '/admin/quadras' : '/app/quadras' }));

    state.reservations
      .filter((reservation) => (isAdmin || reservation.clientId === user.id) && `${reservation.code} ${reservation.clientName} ${reservation.courtName} ${reservation.status}`.toLocaleLowerCase('pt-BR').includes(normalized))
      .slice(0, 5)
      .forEach((reservation) => result.push({ id: `reservation-${reservation.id}`, group: 'Reservas', label: reservation.code, detail: `${reservation.courtName} · ${reservation.status}`, to: isAdmin ? `/admin/reservas?reserva=${reservation.id}` : `/app/reservas?reserva=${reservation.id}` }));

    state.payments
      .filter((payment) => (isAdmin || visibleReservationIds?.has(payment.reservationId)) && `${payment.reservationCode} ${payment.method} ${payment.transactionCode} ${payment.status}`.toLocaleLowerCase('pt-BR').includes(normalized))
      .slice(0, 4)
      .forEach((payment) => result.push({ id: `payment-${payment.id}`, group: 'Pagamentos', label: payment.transactionCode || payment.reservationCode, detail: `${payment.method} · ${payment.status}`, to: isAdmin ? `/admin/pagamentos?pagamento=${payment.id}` : `/app/pagamentos?pagamento=${payment.id}` }));

    if (isAdmin) {
      state.users
        .filter((candidate) => `${candidate.name} ${candidate.email} ${candidate.role}`.toLocaleLowerCase('pt-BR').includes(normalized))
        .slice(0, 4)
        .forEach((candidate) => result.push({ id: `user-${candidate.id}`, group: 'Usuários', label: candidate.name, detail: `${candidate.email} · ${candidate.role}`, to: '/admin/usuarios' }));
    }

    state.championships
      .filter((championship) => `${championship.name} ${championship.modality} ${championship.status}`.toLocaleLowerCase('pt-BR').includes(normalized))
      .slice(0, 3)
      .forEach((championship) => result.push({ id: `championship-${championship.id}`, group: 'Campeonatos', label: championship.name, detail: `${championship.modality} · ${championship.status.replace(/_/g, ' ')}`, to: isAdmin ? '/admin/campeonatos' : '/app/campeonatos' }));

    if (!isAdmin) {
      state.sportsProfiles
        .filter((profile) => profile.userId !== user.id && `${profile.name} ${profile.city} ${profile.primaryModality}`.toLocaleLowerCase('pt-BR').includes(normalized))
        .slice(0, 4)
        .forEach((profile) => result.push({ id: `partner-${profile.id}`, group: 'Parceiros', label: profile.name, detail: `${profile.primaryModality} · ${profile.city}`, to: '/app/parceiros' }));
    }

    return result.slice(0, 24);
  }, [debouncedQuery, state.championships, state.courts, state.payments, state.reservations, state.sportsProfiles, state.users, user]);

  useEffect(() => setActiveResult(0), [debouncedQuery]);

  if (!user) return null;
  const nav = user.role === 'ADMIN' ? adminNav : clientNav;
  const home = user.role === 'ADMIN' ? '/admin' : '/app';
  const demoExplanation = connectionError || 'Os dados desta demonstração são armazenados localmente no navegador.';

  const dismissDemoNotice = () => {
    localStorage.setItem(DEMO_NOTICE_KEY, 'true');
    setDemoNoticeOpen(false);
  };

  const openResult = (item: SearchResult) => {
    navigate(item.to);
    setQuery('');
    setSearchOpen(false);
    setMobileSearchOpen(false);
  };

  const searchField = (
    <div className="relative w-full" data-global-search>
      <IconField
        id="global-search"
        inputRef={searchRef}
        leadingIcon={<Search className="h-4 w-4" />}
        trailingIcon={query ? <X className="h-4 w-4" /> : undefined}
        trailingIconLabel="Limpar busca"
        onTrailingIconClick={query ? () => { setQuery(''); searchRef.current?.focus(); } : undefined}
        value={query}
        onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
        onFocus={() => setSearchOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setActiveResult((value) => (value + 1) % results.length); }
          if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setActiveResult((value) => (value - 1 + results.length) % results.length); }
          if (event.key === 'Enter' && results[activeResult]) { event.preventDefault(); openResult(results[activeResult]); }
        }}
        placeholder="Buscar quadras, reservas, pagamentos, usuários..."
        aria-label="Busca global"
        role="combobox"
        aria-expanded={searchOpen && debouncedQuery.length >= 2}
        aria-controls="global-search-results"
        aria-autocomplete="list"
        aria-activedescendant={searchOpen && results[activeResult] ? `search-result-${activeResult}` : undefined}
        className="py-2 text-sm"
      />
      {!query && <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 py-0.5 text-[10px] font-bold text-muted xl:block">Ctrl K</span>}
      {searchOpen && debouncedQuery.length >= 2 && (
        <div id="global-search-results" className="modal-surface animate-enter absolute left-0 right-0 top-[calc(100%+.5rem)] z-[60] max-h-[min(70dvh,32rem)] overflow-auto rounded-lg p-2 shadow-panel" role="listbox">
          {results.length === 0 ? (
            <div className="p-5 text-center">
              <Search className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
              <p className="mt-2 font-bold">Nenhum resultado</p>
              <p className="mt-1 text-xs text-muted">Tente nome, código, modalidade ou status.</p>
            </div>
          ) : results.map((item, index) => (
            <button
              id={`search-result-${index}`}
              key={item.id}
              className={`flex w-full items-center justify-between gap-4 rounded-md px-3 py-2.5 text-left text-sm ${index === activeResult ? 'bg-neon/10 ring-1 ring-neon/30' : 'hover:bg-[var(--surface-hover)]'}`}
              role="option"
              aria-selected={index === activeResult}
              onMouseEnter={() => setActiveResult(index)}
              onClick={() => openResult(item)}
            >
              <span className="min-w-0"><span className="block truncate font-semibold">{item.label}</span><span className="block truncate text-xs text-muted">{item.detail}</span></span>
              <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] font-bold text-muted">{item.group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderNav = (collapsed = false) => (
    <nav className="mt-6 grid gap-1" aria-label="Navegação principal">
      {nav.map((item) => {
        const Icon = item.icon;
        const link = (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === home}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) => `flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition ${collapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-neon/15 text-neon ring-1 ring-neon/20' : 'text-muted hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
            aria-label={collapsed ? item.label : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
          </NavLink>
        );
        return collapsed ? <Tooltip key={item.to} content={item.label} placement="right">{link}</Tooltip> : link;
      })}
    </nav>
  );

  const handleSwitch = async (role: 'ADMIN' | 'CLIENTE') => {
    if (role === user.role || switching) return;
    setSwitching(true);
    try {
      const next = await switchAccount(role);
      setProfileAnchor(null);
      setDrawerOpen(false);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      navigate(next.role === 'ADMIN' ? '/admin' : '/app', { replace: true });
      setToastTone('success');
      setToast(`Conta alterada para ${next.role === 'ADMIN' ? 'Administrador' : 'Cliente'}.`);
    } catch (error) {
      setToastTone('danger');
      setToast(error instanceof Error ? error.message : 'Não foi possível trocar a conta.');
    } finally {
      setSwitching(false);
    }
  };

  const renderProfileMenu = (placement: 'sidebar' | 'header') => profileAnchor === placement && (
    <div
      className={`modal-surface animate-enter z-[60] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-lg p-2 shadow-panel ${placement === 'sidebar' ? 'absolute bottom-[calc(100%+.65rem)] left-0 w-[min(22rem,calc(100vw-2rem))]' : 'fixed left-4 right-4 top-[4.75rem] w-auto sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+.65rem)] sm:w-[min(22rem,calc(100vw-2rem))]'}`}
      role="menu"
      aria-label="Conta e perfil"
    >
      <div className="flex items-center gap-3 border-b border-line p-3">
        <Avatar name={user.name} src={avatarSrc(user.profile.photo)} size={48} />
        <div className="min-w-0"><p className="truncate font-black">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p><p className="mt-1 text-[11px] font-bold text-neon">{user.role === 'ADMIN' ? 'Administrador' : user.profile.level} · {sessionSource === 'api' ? 'API' : 'Demo local'}</p></div>
      </div>
      <button className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold hover:bg-[var(--surface-hover)]" onClick={() => { navigate(user.role === 'ADMIN' ? '/admin/perfil' : '/app/perfil'); setProfileAnchor(null); }} role="menuitem"><UserCircle className="h-4 w-4 text-neon" />Meu perfil</button>
      <button className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold hover:bg-[var(--surface-hover)]" onClick={() => { navigate(user.role === 'ADMIN' ? '/admin/preferencias' : '/app/preferencias'); setProfileAnchor(null); }} role="menuitem"><Settings className="h-4 w-4 text-cyan" />Preferências</button>
      <div className="my-2 border-t border-line pt-2">
        <p className="px-3 pb-1 text-[10px] font-black uppercase text-muted">Trocar conta demo</p>
        <button className="flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm font-semibold hover:bg-[var(--surface-hover)] disabled:opacity-50" disabled={user.role === 'ADMIN' || switching} onClick={() => handleSwitch('ADMIN')}><span>Administrador</span>{user.role === 'ADMIN' && <span className="text-xs text-neon">Atual</span>}</button>
        <button className="flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm font-semibold hover:bg-[var(--surface-hover)] disabled:opacity-50" disabled={user.role === 'CLIENTE' || switching} onClick={() => handleSwitch('CLIENTE')}><span>Cliente</span>{user.role === 'CLIENTE' && <span className="text-xs text-neon">Atual</span>}</button>
      </div>
      <button className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]" onClick={() => { logout(); navigate('/login', { replace: true }); }}><LogOut className="h-4 w-4" />Sair</button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className={`glass-panel fixed inset-y-0 left-0 z-30 hidden flex-col rounded-none border-y-0 border-l-0 p-4 transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          <Link to={home} aria-label="PlaySpace home">{sidebarCollapsed ? <div className="grid h-11 w-11 place-items-center rounded-full border border-neon/30 bg-neon/10 text-sm font-black text-neon">PS</div> : <Logo />}</Link>
          {!sidebarCollapsed && <Tooltip content="Recolher sidebar" placement="right"><button className="ghost-button rounded-lg p-2" onClick={() => setSidebarCollapsed(true)} aria-label="Recolher sidebar"><PanelLeftClose className="h-4 w-4" /></button></Tooltip>}
        </div>
        {sidebarCollapsed && <Tooltip content="Expandir sidebar" placement="right"><button className="ghost-button mx-auto mt-3 rounded-lg p-2" onClick={() => setSidebarCollapsed(false)} aria-label="Expandir sidebar"><PanelLeftOpen className="h-4 w-4" /></button></Tooltip>}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">{renderNav(sidebarCollapsed)}</div>
        {sessionSource === 'demo' && (
          <Tooltip content={demoExplanation} placement="right">
            <button className={`mb-2 flex min-h-9 items-center rounded-lg border border-amber/30 bg-amber/10 text-xs font-black text-amber ${sidebarCollapsed ? 'mx-auto w-10 justify-center' : 'w-full justify-center gap-2 px-3'}`} onClick={() => setDemoNoticeOpen(true)} aria-label="Modo demo: ver informações">
              <span className="h-2 w-2 rounded-full bg-amber" aria-hidden="true" />
              {!sidebarCollapsed && 'Modo demo'}
            </button>
          </Tooltip>
        )}
        <div ref={sidebarProfileRef} className="relative mt-3">
          <button className={`app-card flex min-h-14 w-full items-center rounded-lg p-2 text-left ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`} onClick={() => setProfileAnchor((value) => value === 'sidebar' ? null : 'sidebar')} aria-expanded={profileAnchor === 'sidebar'} aria-haspopup="menu">
            <Avatar name={user.name} src={avatarSrc(user.profile.photo)} size={40} />
            {!sidebarCollapsed && <><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{user.name}</span><span className="block truncate text-xs text-muted">{user.role === 'ADMIN' ? 'Administrador' : user.profile.level}</span></span><ChevronDown className={`h-4 w-4 text-muted transition ${profileAnchor === 'sidebar' ? 'rotate-180' : ''}`} /></>}
          </button>
          {renderProfileMenu('sidebar')}
        </div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[2px] lg:hidden" onMouseDown={() => setDrawerOpen(false)}>
          <aside className="modal-surface flex h-full w-80 max-w-[88vw] flex-col rounded-none border-y-0 border-l-0 p-5" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Menu de navegação">
            <div className="flex items-center justify-between gap-3"><Logo /><button className="ghost-button rounded-lg p-2" onClick={() => setDrawerOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">{renderNav(false)}</div>
            {sessionSource === 'demo' && <button className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-lg border border-amber/30 bg-amber/10 px-3 text-xs font-black text-amber" onClick={() => { setDrawerOpen(false); setDemoNoticeOpen(true); }}><span className="h-2 w-2 rounded-full bg-amber" aria-hidden="true" />Modo demo</button>}
            <button className="app-card mt-4 flex min-h-14 items-center gap-3 rounded-lg p-3 text-left" onClick={() => { setDrawerOpen(false); setProfileAnchor('header'); }}><Avatar name={user.name} src={avatarSrc(user.profile.photo)} size={42} /><span className="min-w-0"><span className="block truncate font-bold">{user.name}</span><span className="block text-xs text-muted">Abrir menu da conta</span></span></button>
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <header className="sticky top-0 z-20 border-b border-line bg-[var(--bg)]/88 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="ghost-button shrink-0 rounded-lg p-2 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
            <div className="hidden min-w-0 flex-1 sm:block">{searchField}</div>
            <button className="ghost-button rounded-lg p-2 sm:hidden" onClick={() => { setMobileSearchOpen(true); window.setTimeout(() => searchRef.current?.focus(), 0); }} aria-label="Abrir busca"><Search className="h-5 w-5" /></button>
            <Tooltip content={state.preferences.theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}><button className="ghost-button rounded-lg p-2" onClick={toggleTheme} aria-label="Alternar tema">{state.preferences.theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button></Tooltip>
            <NotificationBell user={user} onNavigate={(path) => navigate(path)} />
            <div ref={headerProfileRef} className="relative block">
              <button className="ghost-button flex min-h-10 items-center gap-1 rounded-lg px-1.5 sm:gap-2 sm:px-2" onClick={() => setProfileAnchor((value) => value === 'header' ? null : 'header')} aria-label="Abrir menu do usuário" aria-expanded={profileAnchor === 'header'} aria-haspopup="menu"><Avatar name={user.name} src={avatarSrc(user.profile.photo)} size={30} /><ChevronDown className="hidden h-3.5 w-3.5 text-muted sm:block" /></button>
              {renderProfileMenu('header')}
            </div>
            <Tooltip content="Sair"><button className="ghost-button hidden rounded-lg p-2 md:inline-grid" onClick={() => { logout(); navigate('/login', { replace: true }); }} aria-label="Sair"><LogOut className="h-5 w-5" /></button></Tooltip>
          </div>
        </header>

        {mobileSearchOpen && <div className="modal-overlay fixed inset-0 z-[70] p-3 sm:hidden" onMouseDown={() => setMobileSearchOpen(false)}><div className="modal-surface rounded-lg p-3" onMouseDown={(event) => event.stopPropagation()}>{searchField}<button className="ghost-button mt-3 w-full rounded-lg px-3 py-2 text-sm font-bold" onClick={() => setMobileSearchOpen(false)}>Fechar busca</button></div></div>}

        <main className="px-4 py-6 pb-24 md:px-6 lg:pb-8">
          {!online && <div className="mb-5 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)]" role="alert"><strong>Você está offline.</strong> Alterações remotas ficam indisponíveis até a conexão voltar.</div>}
          {sessionSource === 'demo' && demoNoticeOpen && (
            <div className="animate-enter mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm" role="status">
              <span><strong className="text-amber">Modo demo.</strong> {demoExplanation}</span>
              <button className="ghost-button inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-black" onClick={dismissDemoNotice}>Entendi <X className="h-3.5 w-3.5" aria-hidden="true" /></button>
            </div>
          )}
          {!state.preferences.tourDone && (
            <div className="animate-enter mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neon/30 bg-neon/10 p-4">
              <div><p className="font-black">Bem-vindo ao PlaySpace</p><p className="text-sm text-muted">Use a busca global, abra notificações e teste a reserva com pagamento demonstrativo.</p></div>
              <button className="neon-button rounded-lg px-4 py-2 text-sm font-bold" onClick={finishTour}>Entendi</button>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-line bg-[var(--bg)]/95 px-2 py-2 backdrop-blur-xl lg:hidden" aria-label="Navegação rápida">
        {nav.slice(0, 5).map((item) => { const Icon = item.icon; const mobileLabel = item.label === 'Nova reserva' ? 'Reservar' : item.label; return <NavLink key={item.to} to={item.to} end={item.to === home} aria-label={item.label} className={({ isActive }) => `grid min-h-12 place-items-center gap-1 rounded-lg p-1 text-[11px] font-semibold sm:text-xs ${isActive ? 'bg-neon/15 text-neon' : 'text-muted'}`}><Icon className="h-4 w-4" /><span className="max-w-full truncate">{mobileLabel}</span></NavLink>; })}
      </nav>
      <Toast message={toast} tone={toastTone} onClose={() => setToast('')} />
    </div>
  );
}
