import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, useAuth } from './contexts/AuthContext';
import { AppShell } from './layouts/AppShell';

const adminPages = () => import('./features/admin/AdminPages');
const clientPages = () => import('./features/client/ClientPages');
const systemPages = () => import('./features/system/SystemPages');

const AdminAgendaPage = lazy(() => adminPages().then((module) => ({ default: module.AdminAgendaPage })));
const AdminCommunityPage = lazy(() => adminPages().then((module) => ({ default: module.AdminCommunityPage })));
const AdminCourtsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminCourtsPage })));
const AdminDashboard = lazy(() => adminPages().then((module) => ({ default: module.AdminDashboard })));
const AdminPaymentsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminPaymentsPage })));
const AdminReportsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminReportsPage })));
const AdminReservationsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminReservationsPage })));
const AdminSettingsPage = lazy(() => adminPages().then((module) => ({ default: module.AdminSettingsPage })));
const AdminStatusPage = lazy(() => adminPages().then((module) => ({ default: module.AdminStatusPage })));
const AdminUsersPage = lazy(() => adminPages().then((module) => ({ default: module.AdminUsersPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const ClientAgendaPage = lazy(() => clientPages().then((module) => ({ default: module.ClientAgendaPage })));
const ClientAiPage = lazy(() => clientPages().then((module) => ({ default: module.ClientAiPage })));
const ClientChampionshipsPage = lazy(() => clientPages().then((module) => ({ default: module.ClientChampionshipsPage })));
const ClientCommunityPage = lazy(() => clientPages().then((module) => ({ default: module.ClientCommunityPage })));
const ClientCourtsPage = lazy(() => clientPages().then((module) => ({ default: module.ClientCourtsPage })));
const ClientHomePage = lazy(() => clientPages().then((module) => ({ default: module.ClientHomePage })));
const ClientNewReservationPage = lazy(() => clientPages().then((module) => ({ default: module.ClientNewReservationPage })));
const ClientPartnersPage = lazy(() => clientPages().then((module) => ({ default: module.ClientPartnersPage })));
const ClientPaymentsPage = lazy(() => clientPages().then((module) => ({ default: module.ClientPaymentsPage })));
const ClientProfilePage = lazy(() => clientPages().then((module) => ({ default: module.ClientProfilePage })));
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
        <Route path="comunidade" element={<AdminCommunityPage />} />
        <Route path="usuarios" element={<AdminUsersPage />} />
        <Route path="relatorios" element={<AdminReportsPage />} />
        <Route path="configuracoes" element={<AdminSettingsPage />} />
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
        <Route path="perfil" element={<ClientProfilePage />} />
        <Route path="estatisticas" element={<ClientStatsPage />} />
        <Route path="comunidade" element={<ClientCommunityPage />} />
        <Route path="ranking" element={<ClientRankingPage />} />
        <Route path="parceiros" element={<ClientPartnersPage />} />
        <Route path="campeonatos" element={<ClientChampionshipsPage />} />
        <Route path="ai" element={<ClientAiPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
