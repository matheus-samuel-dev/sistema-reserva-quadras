import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, useAuth } from './contexts/AuthContext';
import { AppShell } from './layouts/AppShell';

const adminPages = () => import('./features/admin/AdminPages');
const clientPages = () => import('./features/client/ClientPages');
const systemPages = () => import('./features/system/SystemPages');
const accountPages = () => import('./features/account/AccountPages');

const AdminAgendaPage = lazy(() => adminPages().then((module) => ({ default: module.AdminAgendaPage })));
const AdminCourtsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminCourtsPage })));
const AdminDashboard = lazy(() => adminPages().then((module) => ({ default: module.AdminDashboard })));
const AdminPaymentsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminPaymentsPage })));
const AdminReportsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminReportsPage })));
const AdminReservationsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminReservationsPage })));
const AdminStatusPage = lazy(() => adminPages().then((module) => ({ default: module.AdminStatusPage })));
const AdminUsersPage = lazy(() => adminPages().then((module) => ({ default: module.AdminUsersPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const CommunityPage = lazy(() => import('./features/community/CommunityPage').then((module) => ({ default: module.CommunityPage })));
const ChampionshipsPage = lazy(() => import('./features/championships/ChampionshipsPage').then((module) => ({ default: module.ChampionshipsPage })));
const PartnersPage = lazy(() => import('./features/partners/PartnersPage').then((module) => ({ default: module.PartnersPage })));
const ProfilePage = lazy(() => accountPages().then((module) => ({ default: module.ProfilePage })));
const PreferencesPage = lazy(() => accountPages().then((module) => ({ default: module.PreferencesPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const ClientAgendaPage = lazy(() => clientPages().then((module) => ({ default: module.ClientAgendaPage })));
const ClientAiPage = lazy(() => clientPages().then((module) => ({ default: module.ClientAiPage })));
const ClientCourtsPage = lazy(() => clientPages().then((module) => ({ default: module.ClientCourtsPage })));
const ClientHomePage = lazy(() => clientPages().then((module) => ({ default: module.ClientHomePage })));
const ClientNewReservationPage = lazy(() => clientPages().then((module) => ({ default: module.ClientNewReservationPage })));
const ClientPaymentsPage = lazy(() => clientPages().then((module) => ({ default: module.ClientPaymentsPage })));
const ClientRankingPage = lazy(() => clientPages().then((module) => ({ default: module.ClientRankingPage })));
const ClientReservationsPage = lazy(() => clientPages().then((module) => ({ default: module.ClientReservationsPage })));
const ClientStatsPage = lazy(() => clientPages().then((module) => ({ default: module.ClientStatsPage })));
const LandingPage = lazy(() => import('./features/landing/LandingPage').then((module) => ({ default: module.LandingPage })));
const ForbiddenPage = lazy(() => systemPages().then((module) => ({ default: module.ForbiddenPage })));
const MaintenancePage = lazy(() => systemPages().then((module) => ({ default: module.MaintenancePage })));
const NotFoundPage = lazy(() => systemPages().then((module) => ({ default: module.NotFoundPage })));
const OfflinePage = lazy(() => systemPages().then((module) => ({ default: module.OfflinePage })));
const ServerErrorPage = lazy(() => systemPages().then((module) => ({ default: module.ServerErrorPage })));

function RouteFallback() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-4" role="status" aria-live="polite">
      <div className="glass-panel rounded-lg px-6 py-5 text-sm font-bold text-muted">Carregando área do PlaySpace...</div>
    </main>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="/manutencao" element={<MaintenancePage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="reservas" element={<AdminReservationsPage />} />
        <Route path="quadras" element={<AdminCourtsPage />} />
        <Route path="agenda" element={<AdminAgendaPage />} />
        <Route path="pagamentos" element={<AdminPaymentsPage />} />
        <Route path="comunidade" element={<CommunityPage />} />
        <Route path="campeonatos" element={<ChampionshipsPage />} />
        <Route path="usuarios" element={<AdminUsersPage />} />
        <Route path="relatorios" element={<AdminReportsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="preferencias" element={<PreferencesPage />} />
        <Route path="status" element={<AdminStatusPage />} />
      </Route>
      <Route
        path="/app"
        element={
          <ProtectedRoute roles={['CLIENTE']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientHomePage />} />
        <Route path="reservas" element={<ClientReservationsPage />} />
        <Route path="nova-reserva" element={<ClientNewReservationPage />} />
        <Route path="quadras" element={<ClientCourtsPage />} />
        <Route path="agenda" element={<ClientAgendaPage />} />
        <Route path="pagamentos" element={<ClientPaymentsPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="preferencias" element={<PreferencesPage />} />
        <Route path="estatisticas" element={<ClientStatsPage />} />
        <Route path="comunidade" element={<CommunityPage />} />
        <Route path="ranking" element={<ClientRankingPage />} />
        <Route path="parceiros" element={<PartnersPage />} />
        <Route path="campeonatos" element={<ChampionshipsPage />} />
        <Route path="ai" element={<ClientAiPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
