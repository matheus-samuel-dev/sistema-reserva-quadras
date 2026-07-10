import { Navigate, Route, Routes } from 'react-router-dom';
import {
  AdminAgendaPage,
  AdminCommunityPage,
  AdminCourtsPage,
  AdminDashboard,
  AdminPaymentsPage,
  AdminReportsPage,
  AdminReservationsPage,
  AdminSettingsPage,
  AdminStatusPage,
  AdminUsersPage
} from './features/admin/AdminPages';
import { LoginPage } from './features/auth/LoginPage';
import {
  ClientAgendaPage,
  ClientAiPage,
  ClientChampionshipsPage,
  ClientCommunityPage,
  ClientCourtsPage,
  ClientHomePage,
  ClientNewReservationPage,
  ClientPartnersPage,
  ClientPaymentsPage,
  ClientProfilePage,
  ClientRankingPage,
  ClientReservationsPage,
  ClientStatsPage
} from './features/client/ClientPages';
import { LandingPage } from './features/landing/LandingPage';
import { ProtectedRoute, useAuth } from './contexts/AuthContext';
import { AppShell } from './layouts/AppShell';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
