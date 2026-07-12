import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Flame,
  Gem,
  Heart,
  Medal,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Trophy,
  Users,
  Volleyball,
  Zap
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Avatar } from '../../components/Avatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CourtImage } from '../../components/CourtImage';
import { EmptyState } from '../../components/EmptyState';
import { IconField } from '../../components/IconField';
import { Modal } from '../../components/Modal';
import { PaymentFlow } from '../../components/PaymentFlow';
import { ReservationForm } from '../../components/ReservationForm';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Toast } from '../../components/Toast';
import { WeeklyCalendar } from '../../components/WeeklyCalendar';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Modality, PartnerAd, Reservation, ReservationFormInput } from '../../lib/types';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const modalities: Modality[] = ['Beach Tennis', 'Futevôlei', 'Society', 'Tênis', 'Vôlei', 'Basquete'];
const chartColors = ['var(--primary)', 'var(--info)', '#8B5CF6', 'var(--warning)', 'var(--danger)'];
const chartTooltip = { background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: 'var(--shadow-panel)' };
const iconMap = { Medal, Volleyball, Flame, Zap, Gem, Moon, Trophy, Award };

function ClientHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-black uppercase text-neon">Área do jogador</p>
        <h1 className="mt-1 text-3xl font-black">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function ReservationCard({
  reservation,
  onDetails,
  onCancel,
  onPay
}: {
  reservation: Reservation;
  onDetails?: () => void;
  onCancel?: () => void;
  onPay?: () => void;
}) {
  return (
    <article className="soft-panel card-hover rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-black">{reservation.courtName}</h3>
          <p className="text-sm text-muted">{reservation.modality} · {reservation.date}</p>
          <p className="mt-1 text-sm">{reservation.startTime} - {reservation.endTime} · {reservation.code}</p>
        </div>
        <StatusBadge status={reservation.status} compact />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-line p-2">
          <p className="text-xs text-muted">Jogadores</p>
          <strong>{reservation.players}</strong>
        </div>
        <div className="rounded-lg border border-line p-2">
          <p className="text-xs text-muted">Valor</p>
          <strong className="text-neon">{currency(reservation.totalValue)}</strong>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onDetails && <button className="ghost-button rounded-lg px-3 py-2 text-sm font-semibold" onClick={onDetails}>Detalhes</button>}
        {onPay && reservation.status === 'Pendente' && <button className="neon-button rounded-lg px-3 py-2 text-sm font-bold" onClick={onPay}>Pagar</button>}
        {onCancel && !['Cancelada', 'Concluída'].includes(reservation.status) && <button className="ghost-button rounded-lg px-3 py-2 text-sm font-semibold" onClick={onCancel}>Cancelar</button>}
      </div>
    </article>
  );
}

export function ClientHomePage() {
  const { user } = useAuth();
  const { state } = useAppData();
  const navigate = useNavigate();
  const myReservations = state.reservations.filter((reservation) => reservation.clientId === user?.id);
  const now = new Date();
  const nowKey = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
  const upcoming = myReservations.filter((reservation) => `${reservation.date} ${reservation.endTime}` > nowKey && reservation.status !== 'Cancelada').sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const achievements = state.achievements[user?.id ?? ''] ?? [];

  return (
    <>
      <ClientHeader title={`Olá, ${user?.name.split(' ')[0]}!`} subtitle="Seu resumo esportivo, recomendações e próximos jogos." />
      <section className="glass-panel mb-4 overflow-hidden rounded-lg p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <div>
            <div className="flex items-center gap-3"><p className="text-sm font-bold text-neon">Clima do dia</p><StatusBadge status="Demonstração" compact /></div>
            <h2 className="mt-2 text-4xl font-black">27°C · Ideal para Beach Tennis</h2>
            <p className="mt-3 text-muted">Condição simulada para São Paulo. Se chover, prefira Studio Tênis ou Arena Summit.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="app-card p-4">
              <p className="text-sm text-muted">Sequência atual</p>
              <strong className="text-3xl text-neon">6 jogos</strong>
            </div>
            <div className="app-card p-4">
              <p className="text-sm text-muted">Comparecimento</p>
              <strong className="text-3xl text-neon">{user?.profile.attendanceRate}%</strong>
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Minhas reservas" value={myReservations.length} icon={CalendarDays} tone="neon" />
        <StatCard title="Horas em quadra" value={user?.profile.hoursOnCourt ?? 0} icon={BarChart3} tone="cyan" />
        <StatCard title="Modalidade favorita" value={user?.profile.favoriteModality ?? '-'} icon={Volleyball} tone="amber" />
        <StatCard title="Conquistas" value={achievements.filter((item) => item.percent >= 100).length} icon={Trophy} tone="neon" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_.9fr]">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Próximas reservas</h2>
          <div className="mt-4 grid gap-3">
            {upcoming.slice(0, 4).map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} />)}
            {upcoming.length === 0 && <EmptyState title="Sem reservas futuras" description="Crie uma nova reserva e mantenha sua sequência ativa." actionLabel="Nova reserva" onAction={() => navigate('/app/nova-reserva')} />}
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Conquistas em progresso</h2>
          <div className="mt-4 grid gap-3">
            {achievements.slice(0, 4).map((achievement) => {
              const Icon = iconMap[achievement.icon as keyof typeof iconMap] ?? Award;
              return (
                <div key={achievement.id} className="app-card p-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-neon" />
                    <div className="flex-1">
                      <p className="font-bold">{achievement.title}</p>
                      <div className="mt-2 h-2 rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-neon transition-all" style={{ width: `${achievement.percent}%` }} /></div>
                    </div>
                    <span className="text-sm font-bold text-neon">{achievement.percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

export function ClientReservationsPage() {
  const { user } = useAuth();
  const { state, cancelReservation } = useAppData();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'Próximas' | 'Histórico'>('Próximas');
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [paying, setPaying] = useState<Reservation | null>(null);
  const [canceling, setCanceling] = useState<Reservation | null>(null);
  const [toast, setToast] = useState('');
  const [toastTone, setToastTone] = useState<'success' | 'danger'>('success');
  const today = new Date().toISOString().slice(0, 10);
  const list = state.reservations
    .filter((reservation) => reservation.clientId === user?.id)
    .filter((reservation) => tab === 'Próximas' ? reservation.date >= today && reservation.status !== 'Cancelada' : reservation.date < today || ['Cancelada', 'Concluída'].includes(reservation.status));

  const confirmCancel = async () => {
    if (!canceling || !user) return;
    try {
      await cancelReservation(canceling.id, user);
      setToastTone('success');
      setToast('Reserva cancelada com sucesso.');
    } catch (err) {
      setToastTone('danger');
      setToast(err instanceof Error ? err.message : 'Não foi possível cancelar.');
    } finally {
      setCanceling(null);
    }
  };

  return (
    <>
      <ClientHeader title="Minhas reservas" subtitle="Acompanhe próximas partidas, histórico, pagamento e cancelamento." />
      <div className="mb-4 inline-flex rounded-lg border border-line bg-white/[0.03] p-1">
        {(['Próximas', 'Histórico'] as const).map((item) => <button key={item} className={`min-h-11 rounded-md px-4 py-2 text-sm font-bold transition ${tab === item ? 'bg-neon text-[#07110c]' : 'text-muted hover:text-[var(--text)]'}`} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onDetails={() => setSelected(reservation)}
            onPay={() => setPaying(reservation)}
            onCancel={() => setCanceling(reservation)}
          />
        ))}
      </div>
      {list.length === 0 && <EmptyState title="Nenhuma reserva nesta aba" description="As reservas aparecerão aqui automaticamente quando você criar ou concluir jogos." actionLabel="Nova reserva" onAction={() => navigate('/app/nova-reserva')} />}
      <Modal title="Detalhes da reserva" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <ReservationCard reservation={selected} />}</Modal>
      <Modal title="Pagamento demo" open={Boolean(paying)} onClose={() => setPaying(null)}>{paying && <PaymentFlow reservation={paying} onPaid={() => { setPaying(null); setToastTone('success'); setToast('Pagamento aprovado. Reserva confirmada.'); }} />}</Modal>
      <ConfirmDialog open={Boolean(canceling)} title="Cancelar reserva" description={`Confirme o cancelamento da reserva ${canceling?.code ?? ''}.`} confirmLabel="Cancelar reserva" onClose={() => setCanceling(null)} onConfirm={confirmCancel} />
      <Toast message={toast} tone={toastTone} onClose={() => setToast('')} />
    </>
  );
}

export function ClientNewReservationPage() {
  const { user } = useAuth();
  const { state } = useAppData();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const reservation = state.reservations.find((item) => item.id === createdId);

  return (
    <>
      <ClientHeader title="Nova reserva" subtitle="Escolha quadra, horário e avance para pagamento demo." />
      <section className="glass-panel rounded-lg p-5">
        {user && <ReservationForm actor={user} onCreated={setCreatedId} />}
      </section>
      <Modal title="Pagamento da reserva" open={Boolean(reservation)} onClose={() => setCreatedId(null)}>
        {reservation && <PaymentFlow reservation={reservation} onPaid={() => setCreatedId(null)} />}
      </Modal>
    </>
  );
}

export function ClientCourtsPage() {
  const { state, toggleFavoriteCourt } = useAppData();
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const filtered = state.courts.filter((court) => {
    const text = `${court.name} ${court.modality} ${court.location}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!availableOnly || court.status === 'Disponível');
  });
  return (
    <>
      <ClientHeader title="Ver quadras" subtitle="Explore quadras, favoritos, preços, avaliações e disponibilidade." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <IconField label="Buscar quadras" leadingIcon={<Search className="h-4 w-4" />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Quadra, setor ou modalidade" />
        <label className="ghost-button flex min-h-12 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold">
          <input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} aria-label="Mostrar apenas quadras disponíveis" />
          Disponíveis
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((court) => (
          <article key={court.id} className="glass-panel card-hover overflow-hidden rounded-lg">
            <CourtImage courtId={court.id} courtName={court.name} modality={court.modality} className="aspect-[16/8] border-b border-line" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-black">{court.name}</h2>
                  <p className="text-sm text-muted">{court.modality} · {court.location}</p>
                </div>
                <button className="ghost-button rounded-lg p-2" onClick={() => toggleFavoriteCourt(court.id)} aria-label="Favoritar quadra">
                  <Heart className={`h-4 w-4 ${state.preferences.favoriteCourts.includes(court.id) ? 'fill-neon text-neon' : ''}`} />
                </button>
              </div>
              <p className="mt-3 min-h-10 text-sm text-muted">{court.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <strong className="text-neon">{currency(court.pricePerHour)}/h</strong>
                <StatusBadge status={court.status} compact />
              </div>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState title="Nenhuma quadra encontrada" description="Ajuste a busca ou remova o filtro de disponibilidade." />}
    </>
  );
}

export function ClientAgendaPage() {
  const { state, dataSource, ensureAvailabilityRange } = useAppData();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const [reservationDraft, setReservationDraft] = useState<Partial<ReservationFormInput>>({});
  const [courtFilter, setCourtFilter] = useState('Todas');
  const [modalityFilter, setModalityFilter] = useState<Modality | 'Todas'>('Todas');
  const [toast, setToast] = useState('');
  const { user } = useAuth();
  const agendaReservations = state.reservations.map((reservation) => reservation.clientId === user?.id ? reservation : { ...reservation, code: 'Horário ocupado', clientName: 'Reservado', notes: undefined, totalValue: 0, players: 0, history: ['Horário indisponível'] });
  return (
    <>
      <ClientHeader title="Agenda" subtitle="Veja horários, filtre quadras e encontre janelas livres sem expor dados de outros jogadores." action={<div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold text-muted">Quadra<select className="form-control min-w-44 py-2 text-sm" value={courtFilter} onChange={(event) => setCourtFilter(event.target.value)}><option value="Todas">Todas as quadras</option>{state.courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</select></label><label className="grid gap-1.5 text-xs font-bold text-muted">Modalidade<select className="form-control min-w-44 py-2 text-sm" value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value as Modality | 'Todas')}><option value="Todas">Todas as modalidades</option>{modalities.map((item) => <option key={item}>{item}</option>)}</select></label></div>} />
      <WeeklyCalendar reservations={agendaReservations} courtFilter={courtFilter} modalityFilter={modalityFilter} onReservationClick={(reservation) => reservation.clientId === user?.id ? setSelected(reservation) : setToast('Este horário já está ocupado. Os dados do outro jogador permanecem privados.')} onNewReservation={(initialValues) => { setReservationDraft(initialValues ?? {}); setCreating(true); }} onVisibleRangeChange={dataSource === 'api' ? ensureAvailabilityRange : undefined} />
      <Modal title="Reserva selecionada" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <ReservationCard reservation={selected} />}</Modal>
      <Modal title="Nova reserva" open={creating} onClose={() => setCreating(false)}>{user && <ReservationForm actor={user} initialValues={reservationDraft} onCreated={() => { setCreating(false); setReservationDraft({}); }} />}</Modal>
      <Toast message={toast} tone="info" onClose={() => setToast('')} />
    </>
  );
}

export function ClientPaymentsPage() {
  const { user } = useAuth();
  const { state } = useAppData();
  const [query, setQuery] = useState('');
  const payments = state.payments.filter((payment) => state.reservations.find((reservation) => reservation.id === payment.reservationId)?.clientId === user?.id);
  const filtered = payments.filter((payment) => `${payment.reservationCode} ${payment.method} ${payment.transactionCode}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <ClientHeader title="Pagamentos" subtitle="Histórico de pagamentos PIX e cartões em modo demo." />
      <IconField wrapperClassName="mb-4" label="Buscar pagamentos" leadingIcon={<Search className="h-4 w-4" />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Reserva, método ou transação" />
      <div className="grid gap-3">
        {filtered.map((payment) => (
          <div key={payment.id} className="glass-panel card-hover flex items-center justify-between gap-3 rounded-lg p-4">
            <div>
              <p className="font-black">{payment.reservationCode}</p>
              <p className="text-sm text-muted">{payment.method} · {payment.transactionCode}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{currency(payment.amount)}</p>
              <StatusBadge status={payment.status} compact />
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState title="Nenhum pagamento encontrado" description="Pagamentos aparecem aqui após uma reserva ser processada." />}
    </>
  );
}

export function ClientProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <ClientHeader title="Meu perfil esportivo" subtitle="Identidade, modalidades, conquistas e presença em quadra." />
      <section className="glass-panel overflow-hidden rounded-lg">
        <div className="h-40 bg-[linear-gradient(135deg,rgba(124,255,79,.25),rgba(85,214,255,.12)),radial-gradient(circle_at_20%_40%,rgba(124,255,79,.22),transparent_20rem)]" />
        <div className="-mt-12 p-5">
          <Avatar name={user.name} src={user.profile.photo} size={96} className="border-4 border-[var(--bg)] text-2xl" />
          <h2 className="mt-4 text-3xl font-black">{user.name}</h2>
          <p className="text-muted">{user.profile.city} · membro desde {user.profile.memberSince}</p>
          <p className="mt-4 max-w-2xl text-muted">{user.profile.bio}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Modalidade favorita', user.profile.favoriteModality],
              ['Nível esportivo', user.profile.level],
              ['Reservas realizadas', String(user.profile.reservationsDone)],
              ['Horas em quadra', String(user.profile.hoursOnCourt)]
            ].map(([label, value]) => <div key={label} className="app-card p-4"><p className="text-sm text-muted">{label}</p><strong>{value}</strong></div>)}
          </div>
        </div>
      </section>
    </>
  );
}

export function ClientStatsPage() {
  const { user } = useAuth();
  const { state } = useAppData();
  const myReservations = state.reservations.filter((reservation) => reservation.clientId === user?.id);
  const myReservationIds = new Set(myReservations.map((item) => item.id));
  const monthly = Array.from({ length: 6 }, (_, reverseIndex) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - (5 - reverseIndex));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), reservas: myReservations.filter((item) => item.date.startsWith(key) && item.status !== 'Cancelada').length, gasto: state.payments.filter((payment) => myReservationIds.has(payment.reservationId) && payment.status === 'Aprovado' && (payment.paidAt ?? '').startsWith(key)).reduce((sum, payment) => sum + payment.amount, 0) };
  });
  const byModality = modalities.map((sport) => ({ name: sport, value: myReservations.filter((item) => item.modality === sport && item.status !== 'Cancelada').length })).filter((item) => item.value > 0);
  const monthlySpend = monthly[monthly.length - 1]?.gasto ?? 0;
  return (
    <>
      <ClientHeader title="Estatísticas" subtitle="Evolução mensal, gasto, modalidades e frequência esportiva." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de reservas" value={myReservations.length} icon={CalendarDays} tone="neon" />
        <StatCard title="Total de partidas" value={user?.profile.matchesPlayed ?? 0} icon={Volleyball} tone="cyan" />
        <StatCard title="Gasto mensal" value={currency(monthlySpend)} icon={CreditCard} tone="amber" />
        <StatCard title="Sequência atual" value={`${Math.min(myReservations.filter((item) => item.status === 'Concluída').length, 6)} jogos`} icon={Flame} tone="neon" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Evolução mensal</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid stroke="var(--line)" />
                <XAxis dataKey="month" stroke="var(--muted)" />
                <YAxis yAxisId="reservas" stroke="var(--primary)" allowDecimals={false} />
                <YAxis yAxisId="gasto" orientation="right" stroke="var(--info)" tickFormatter={(value) => `R$ ${value}`} />
                <RechartsTooltip contentStyle={chartTooltip} formatter={(value, name) => name === 'gasto' ? [currency(Number(value)), 'Gasto'] : [value, 'Reservas']} />
                <Legend formatter={(value) => value === 'gasto' ? 'Gasto (R$)' : 'Reservas'} />
                <Line yAxisId="reservas" dataKey="reservas" stroke="var(--primary)" strokeWidth={3} />
                <Line yAxisId="gasto" dataKey="gasto" stroke="var(--info)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Utilização das modalidades</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byModality} dataKey="value" innerRadius={60} outerRadius={90}>
                  {byModality.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  );
}

export function ClientCommunityPage() {
  const { state, likePost, commentPost } = useAppData();
  const [toast, setToast] = useState('');
  return (
    <>
      <ClientHeader title="Feed da comunidade" subtitle="Timeline com reservas, conquistas, campeonatos e novidades." />
      <div className="grid gap-3">
        {state.posts.map((post) => (
          <article key={post.id} className="glass-panel card-hover rounded-lg p-4">
            <div className="flex items-start gap-3"><Avatar name={post.authorName} src={post.avatarUrl ?? state.users.find((item) => item.id === post.authorId)?.profile.photo} size={42} /><p><strong>{post.authorName}</strong> {post.content}</p></div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => void likePost(post.id)}>Curtir · {post.likes}</button>
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => { commentPost(post.id); setToast('Comentário demonstrativo adicionado.'); }}>Comentar · {post.comments}</button>
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => { navigator.clipboard?.writeText(post.content); setToast('Publicação copiada.'); }}>Compartilhar</button>
            </div>
          </article>
        ))}
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

export function ClientRankingPage() {
  const { state } = useAppData();
  const [period, setPeriod] = useState<'Semanal' | 'Mensal' | 'Anual'>('Mensal');
  const ranking = [...state.ranking].sort((a, b) => b.hours - a.hours);
  const divisor = period === 'Semanal' ? 52 : period === 'Mensal' ? 12 : 1;
  return (
    <>
      <ClientHeader title="Ranking da comunidade" subtitle="Filtros semanal, mensal e anual com reservas, horas e frequência." />
      <div className="mb-4 flex flex-wrap gap-2">{(['Semanal', 'Mensal', 'Anual'] as const).map((item) => <button key={item} className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-bold ${period === item ? 'border-neon bg-neon/10 text-neon' : 'border-line text-muted'}`} onClick={() => setPeriod(item)} aria-pressed={period === item}>{item}</button>)}</div>
      <div className="grid gap-3">
        {ranking.map((player, index) => (
          <div key={player.id} className="glass-panel card-hover flex min-w-0 max-w-full items-center gap-3 rounded-lg p-4 sm:gap-4">
            <strong className="grid h-10 w-10 place-items-center rounded-full bg-neon/15 text-neon">#{index + 1}</strong>
            <Avatar name={player.name} src={state.users.find((user) => user.id === player.id)?.profile.photo} size={44} />
            <div className="min-w-0 flex-1">
              <p className="font-black leading-tight">{player.name}</p>
              <p className="mt-0.5 text-xs leading-4 text-muted sm:text-sm sm:leading-5">{player.favoriteModality} · {player.attendanceRate}% comparecimento</p>
            </div>
            <strong className="ml-auto shrink-0 text-right">{(player.hours / divisor).toFixed(period === 'Anual' ? 0 : 1)}h <span className="block text-[10px] font-semibold text-muted">{period.toLowerCase()}</span></strong>
          </div>
        ))}
      </div>
    </>
  );
}

export function ClientPartnersPage() {
  const { user } = useAuth();
  const { state, addPartnerAd } = useAppData();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [interested, setInterested] = useState<Set<string>>(() => new Set());
  const [form, setForm] = useState<Omit<PartnerAd, 'id'>>({ playerId: user?.id ?? '', playerName: user?.name ?? '', modality: user?.profile.favoriteModality ?? 'Beach Tennis', level: user?.profile.level ?? 'Intermediário', city: user?.profile.city ?? '', availability: 'Ter e Qui, 18:00 - 21:00', notes: '' });
  const filtered = state.partnerAds.filter((ad) => `${ad.playerName} ${ad.modality} ${ad.level} ${ad.city}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <ClientHeader title="Encontrar parceiros" subtitle="Consulte jogadores por modalidade, nível e cidade e simule um anúncio nesta sessão." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Simular anúncio</button>} />
      <IconField wrapperClassName="mb-4" label="Buscar parceiros" leadingIcon={<Search className="h-4 w-4" />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Modalidade, cidade ou nível" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((ad) => (
          <article key={ad.id} className="glass-panel card-hover rounded-lg p-4">
            <div className="flex items-center gap-3"><Avatar name={ad.playerName} src={ad.avatarUrl ?? state.users.find((item) => item.id === ad.playerId)?.profile.photo} size={42} /><p className="font-black">{ad.playerName}</p></div>
            <p className="text-sm text-muted">{ad.modality} · {ad.level} · {ad.city}</p>
            <p className="mt-3 text-sm">{ad.availability}</p>
            <p className="mt-2 min-h-10 text-sm text-muted">{ad.notes}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="neon-button rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-60" disabled={interested.has(ad.id)} onClick={() => { setInterested((current) => new Set(current).add(ad.id)); setToast(`Solicitação demonstrativa enviada para ${ad.playerName}.`); }}>{interested.has(ad.id) ? 'Interesse enviado' : 'Tenho interesse'}</button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState title="Nenhum parceiro encontrado" description="Ajuste a busca ou simule um anúncio local para esta sessão." actionLabel="Simular anúncio" onAction={() => setOpen(true)} />}
      <Modal title="Simular anúncio" open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={(event: FormEvent) => { event.preventDefault(); addPartnerAd(form); setOpen(false); setToast('Anúncio demonstrativo adicionado somente nesta sessão.'); }}>
          <label className="grid gap-2 text-sm font-semibold">Modalidade<select className="form-control" value={form.modality} onChange={(event) => setForm((current) => ({ ...current, modality: event.target.value as Modality }))}>{modalities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-semibold">Disponibilidade<input className="form-control" value={form.availability} onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))} required /></label>
          <label className="grid gap-2 text-sm font-semibold">Descrição<textarea className="form-control min-h-24" placeholder="Conte como você gosta de jogar" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          <button className="neon-button rounded-lg px-5 py-3 font-black">Adicionar simulação</button>
        </form>
      </Modal>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

export function ClientChampionshipsPage() {
  const { state, enrollInChampionship } = useAppData();
  const [toast, setToast] = useState('');
  const [enrolled, setEnrolled] = useState<Set<string>>(() => new Set());
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleEnroll = (championshipId: string) => {
    setEnrolling(championshipId);
    setError('');
    void enrollInChampionship(championshipId)
      .then((message) => {
        setEnrolled((current) => new Set(current).add(championshipId));
        setToast(message);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível confirmar a inscrição.'))
      .finally(() => setEnrolling(null));
  };

  return (
    <>
      <ClientHeader title="Campeonatos" subtitle="Visualize, inscreva-se e acompanhe classificação e chaveamento." />
      {error && <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {state.championships.map((championship) => (
          <article key={championship.id} className="glass-panel card-hover overflow-hidden rounded-lg">
            {(() => { const court = state.courts.find((item) => item.modality === championship.modality); return court ? <CourtImage courtId={court.id} courtName={court.name} modality={court.modality} className="aspect-[16/7] border-b border-line" /> : null; })()}
            <div className="p-5"><p className="text-sm font-bold text-neon">{championship.status}</p>
            <h2 className="mt-2 text-2xl font-black">{championship.name}</h2>
            <p className="mt-2 text-muted">{championship.modality} · {championship.categories}</p>
            <p className="mt-4 text-sm">{championship.regulation}</p>
            <div className="mt-4 flex flex-wrap gap-2">{championship.bracket.map((item) => <span key={item} className="rounded-full border border-line px-3 py-1 text-xs">{item}</span>)}</div>
            <button className="neon-button mt-5 rounded-lg px-4 py-2 font-bold disabled:opacity-60" disabled={enrolled.has(championship.id) || enrolling === championship.id || !championship.status.toLowerCase().includes('inscri')} onClick={() => handleEnroll(championship.id)}>{enrolled.has(championship.id) ? 'Inscrição confirmada' : enrolling === championship.id ? 'Confirmando…' : championship.status.toLowerCase().includes('inscri') ? 'Inscrever-se' : 'Inscrições em breve'}</button>
            </div>
          </article>
        ))}
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

export function ClientAiPage() {
  const { user } = useAuth();
  const { askAi } = useAppData();
  const [question, setQuestion] = useState('Qual meu melhor horário para jogar?');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const suggestions = ['Quanto gastei este mês?', 'Qual modalidade eu mais pratico?', 'Qual quadra utilizo com mais frequência?', 'Quando foi minha última reserva?'];
  return (
    <>
      <ClientHeader title="PlaySpace AI" subtitle="Assistente demonstrativo baseado em regras e nos dados da sua conta." />
      <section className="glass-panel rounded-lg p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-neon/15"><Sparkles className="h-6 w-6 text-neon" /></div>
          <div>
            <h2 className="font-black">PlaySpace AI</h2>
            <p className="text-sm text-muted">Sem envio a serviços externos; a API gera respostas demonstrativas a partir dos dados internos.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => setQuestion(item)}>{item}</button>)}</div>
        <form className="mt-5 flex gap-2" onSubmit={(event) => {
          event.preventDefault();
          if (!user || !question.trim()) return;
          setIsSubmitting(true);
          setError('');
          void askAi(question.trim(), user)
            .then(setAnswer)
            .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível consultar o assistente.'))
            .finally(() => setIsSubmitting(false));
        }}>
          <label className="sr-only" htmlFor="ai-question">Pergunta para o PlaySpace AI</label>
          <input id="ai-question" className="form-control min-w-0 flex-1" value={question} onChange={(event) => setQuestion(event.target.value)} required />
          <button className="neon-button min-w-11 rounded-lg px-3 disabled:opacity-60 sm:px-4" aria-label={isSubmitting ? 'Consultando assistente' : 'Enviar pergunta'} disabled={isSubmitting || !question.trim()}>{isSubmitting ? <span className="text-sm font-bold">…</span> : <Send className="h-5 w-5" />}</button>
        </form>
        {error && <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>}
        {answer && <div className="mt-5 rounded-lg border border-neon/30 bg-neon/10 p-4" aria-live="polite"><p className="text-sm font-bold text-neon">Resposta</p><p className="mt-2">{answer}</p></div>}
      </section>
    </>
  );
}
