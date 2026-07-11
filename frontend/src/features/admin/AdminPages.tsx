import {
  Activity,
  Banknote,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  Flame,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Volleyball,
  XCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { PaymentFlow } from '../../components/PaymentFlow';
import { ReservationForm } from '../../components/ReservationForm';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Toast } from '../../components/Toast';
import { WeeklyCalendar } from '../../components/WeeklyCalendar';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Court, CourtStatus, Modality, Reservation, ReservationStatus, Role, User } from '../../lib/types';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const modalities: Modality[] = ['Beach Tennis', 'Futevôlei', 'Society', 'Tênis', 'Vôlei', 'Basquete'];
const courtStatuses: CourtStatus[] = ['Disponível', 'Em manutenção', 'Indisponível'];
const reservationStatuses: ReservationStatus[] = ['Pendente', 'Confirmada', 'Em andamento', 'Concluída', 'Cancelada'];
const chartColors = ['#7CFF4F', '#55D6FF', '#8B5CF6', '#FFB84D', '#FB7185', '#94A3B8'];
const chartTooltip = { background: '#0b1117', border: '1px solid rgba(148,163,184,.2)', borderRadius: 8 };

const todayIso = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const minutesBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

const mondayOf = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day + (day === 0 ? -6 : 1));
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDaysIso = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
};

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-black uppercase text-neon">PlaySpace Admin</p>
        <h1 className="mt-1 text-3xl font-black">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-black">{title}</h2>
      {action}
    </div>
  );
}

function ReservationDetails({ reservation }: { reservation: Reservation }) {
  return (
    <div className="grid gap-3">
      <div className="soft-panel rounded-lg p-4">
        <p className="text-sm text-muted">Código</p>
        <h3 className="text-2xl font-black">{reservation.code}</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['Cliente', reservation.clientName],
          ['Quadra', reservation.courtName],
          ['Modalidade', reservation.modality],
          ['Data', reservation.date],
          ['Horário', `${reservation.startTime} - ${reservation.endTime}`],
          ['Valor', currency(reservation.totalValue)]
        ].map(([label, value]) => (
          <div key={label} className="app-card p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-bold">{value}</p>
          </div>
        ))}
      </div>
      <StatusBadge status={reservation.status} />
      <div className="rounded-lg border border-line p-3 text-sm text-muted">{reservation.history.join(' · ')}</div>
    </div>
  );
}

export function AdminDashboard() {
  const { state } = useAppData();

  const data = useMemo(() => {
    const today = todayIso();
    const weekStart = mondayOf(new Date());
    const weekDays = Array.from({ length: 7 }, (_, index) => addDaysIso(weekStart, index));
    const activeReservations = state.reservations.filter((item) => item.status !== 'Cancelada');
    const weekReservations = activeReservations.filter((item) => weekDays.includes(item.date));
    const todayReservations = activeReservations.filter((item) => item.date === today);
    const upcoming = activeReservations
      .filter((item) => item.date >= today)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
      .slice(0, 5);
    const revenue = state.payments.filter((item) => item.status === 'Aprovado').reduce((sum, item) => sum + item.amount, 0);
    const occupiedHours = weekReservations.reduce((sum, item) => sum + Math.max(0, minutesBetween(item.startTime, item.endTime)) / 60, 0);
    const totalAvailableHours = Math.max(1, state.courts.length * 14 * 7);
    const occupancy = Math.round((occupiedHours / totalAvailableHours) * 100);
    const cancellations = state.reservations.filter((item) => item.status === 'Cancelada').length;
    const byStatus = reservationStatuses.map((status) => ({ name: status, value: state.reservations.filter((item) => item.status === status).length }));
    const byModality = modalities.map((modality) => ({ name: modality, reservas: state.reservations.filter((item) => item.modality === modality).length }));
    const daily = weekDays.map((day) => ({
      day: new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }),
      reservas: weekReservations.filter((item) => item.date === day).length,
      receita: weekReservations.filter((item) => item.date === day).reduce((sum, item) => sum + item.totalValue, 0)
    }));
    const peakHours = Array.from(
      activeReservations.reduce((map, reservation) => map.set(reservation.startTime, (map.get(reservation.startTime) ?? 0) + 1), new Map<string, number>())
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([hour, reservas]) => ({ hour, reservas }));
    const mostBookedCourt = [...state.courts]
      .map((court) => ({ court, count: state.reservations.filter((item) => item.courtId === court.id).length }))
      .sort((a, b) => b.count - a.count)[0]?.court.name ?? '-';

    return { todayReservations, weekReservations, upcoming, revenue, occupancy, cancellations, byStatus, byModality, daily, peakHours, mostBookedCourt };
  }, [state.courts, state.payments, state.reservations]);

  const executives: Array<[string, string, LucideIcon, 'neon' | 'cyan' | 'amber' | 'danger']> = [
    ['Quadra mais reservada', data.mostBookedCourt, Volleyball, 'neon'],
    ['Horário de maior movimento', data.peakHours[0]?.hour ?? '-', Clock3, 'cyan'],
    ['Modalidade em alta', data.byModality.sort((a, b) => b.reservas - a.reservas)[0]?.name ?? '-', Flame, 'amber'],
    ['Jogadores ativos', String(state.users.filter((user) => user.role === 'CLIENTE' && user.active).length), Users, 'neon']
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Painel executivo com operação, receita, ocupação, cancelamentos e agenda futura." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Reservas hoje" value={data.todayReservations.length} hint="+12% vs ontem" icon={CalendarDays} tone="neon" />
        <StatCard title="Reservas da semana" value={data.weekReservations.length} hint="+9% vs semana anterior" icon={CalendarClock} tone="cyan" />
        <StatCard title="Taxa de ocupação" value={`${data.occupancy}%`} hint="+11% vs mês anterior" icon={TrendingUp} tone="neon" />
        <StatCard title="Receita do mês" value={currency(data.revenue)} hint="+8,5% vs mês anterior" icon={Banknote} tone="amber" />
        <StatCard title="Cancelamentos" value={data.cancellations} hint="monitorar motivos" icon={XCircle} tone="danger" />
        <StatCard title="Próximas reservas" value={data.upcoming.length} hint="agenda ativa" icon={Clock3} tone="cyan" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        {executives.map(([title, value, Icon, tone]) => <StatCard key={title} title={title} value={value} icon={Icon} tone={tone} />)}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Próximas reservas" action={<StatusBadge status="Confirmada" compact />} />
          <div className="grid gap-3">
            {data.upcoming.map((reservation) => (
              <div key={reservation.id} className="app-card flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{reservation.courtName}</p>
                  <p className="truncate text-sm text-muted">{reservation.clientName} · {reservation.date} · {reservation.startTime}</p>
                </div>
                <StatusBadge status={reservation.status} compact />
              </div>
            ))}
            {data.upcoming.length === 0 && <EmptyState title="Sem reservas futuras" description="Novas reservas aparecerão aqui em tempo real." />}
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Reservas e receita da semana" action={<strong className="text-neon">{data.occupancy}% ocupação</strong>} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily}>
                <CartesianGrid stroke="rgba(148,163,184,.12)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={chartTooltip} />
                <Line type="monotone" dataKey="reservas" stroke="#7CFF4F" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="receita" stroke="#55D6FF" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Reservas por status" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                  {data.byStatus.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Reservas por modalidade" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byModality}>
                <XAxis dataKey="name" hide />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={chartTooltip} />
                <Bar dataKey="reservas" fill="#55D6FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Horários mais utilizados" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours}>
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={chartTooltip} />
                <Bar dataKey="reservas" fill="#7CFF4F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Atividade recente" />
          <div className="grid gap-3">
            {state.activities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="app-card p-3">
                <p className="font-semibold">{activity.action}</p>
                <p className="text-xs text-muted">{activity.actor} · {activity.category}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Comunidade e clima" />
          <div className="grid gap-3">
            <div className="app-card p-4">
              <strong className="text-2xl text-neon">27°C</strong>
              <p className="text-sm text-muted">Ideal para Beach Tennis. Quadras abertas recomendadas.</p>
            </div>
            {state.posts.slice(0, 3).map((post) => (
              <p key={post.id} className="app-card p-3 text-sm"><strong>{post.authorName}</strong> {post.content}</p>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function AdminAgendaPage() {
  const { state } = useAppData();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const [courtFilter, setCourtFilter] = useState('Todas');
  const [modalityFilter, setModalityFilter] = useState<Modality | 'Todas'>('Todas');

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Calendário semanal profissional com filtros, legenda, horário atual e feedback ao selecionar janelas livres."
        action={
          <div className="flex flex-wrap gap-2">
            <select className="form-control w-auto min-w-44 px-3 py-2 text-sm" value={courtFilter} onChange={(event) => setCourtFilter(event.target.value)}>
              <option>Todas</option>
              {state.courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
            </select>
            <select className="form-control w-auto min-w-44 px-3 py-2 text-sm" value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value as Modality | 'Todas')}>
              <option>Todas</option>
              {modalities.map((modality) => <option key={modality}>{modality}</option>)}
            </select>
          </div>
        }
      />
      <WeeklyCalendar reservations={state.reservations} courtFilter={courtFilter} modalityFilter={modalityFilter} onReservationClick={setSelected} onNewReservation={() => setCreating(true)} />
      <Modal title="Detalhes da reserva" open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && <ReservationDetails reservation={selected} />}
      </Modal>
      <Modal title="Nova reserva" open={creating} onClose={() => setCreating(false)}>
        {user && <ReservationForm actor={user} onCreated={() => setCreating(false)} />}
      </Modal>
    </>
  );
}

export function AdminCourtsPage() {
  const { state, saveCourt, removeCourt } = useAppData();
  const [editing, setEditing] = useState<Court | null>(null);
  const [removing, setRemoving] = useState<Court | null>(null);
  const [toast, setToast] = useState('');
  const blank: Court = {
    id: '',
    name: '',
    modality: 'Beach Tennis',
    description: '',
    pricePerHour: 120,
    playerCapacity: 4,
    status: 'Disponível',
    image: 'linear-gradient(135deg, #16321f, #0b1117 58%, #77ff4f)',
    location: '',
    lighting: true,
    covered: false,
    rating: 4.8
  };

  return (
    <>
      <PageHeader title="Quadras" subtitle="Gestão de quadras, status, preço, capacidade e estrutura com cards consistentes." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setEditing(blank)}><Plus className="h-4 w-4" />Nova quadra</button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.courts.map((court) => (
          <article key={court.id} className="glass-panel card-hover overflow-hidden rounded-lg">
            <div className="h-32" style={{ background: court.image }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black">{court.name}</h2>
                  <p className="text-sm text-muted">{court.modality} · {court.location}</p>
                </div>
                <StatusBadge status={court.status} compact />
              </div>
              <p className="mt-3 min-h-10 text-sm text-muted">{court.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <span className="rounded-lg border border-line p-2">{currency(court.pricePerHour)}/h</span>
                <span className="rounded-lg border border-line p-2">{court.playerCapacity} jogadores</span>
                <span className="rounded-lg border border-line p-2">{court.covered ? 'Coberta' : 'Aberta'}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="ghost-button rounded-lg p-2" onClick={() => setEditing(court)} aria-label={`Editar ${court.name}`}><Edit3 className="h-4 w-4" /></button>
                <button className="ghost-button rounded-lg p-2" onClick={() => setRemoving(court)} aria-label={`Remover ${court.name}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <CourtModal key={editing?.id || (editing ? 'new' : 'closed')} court={editing} onClose={() => setEditing(null)} onSave={(court) => { saveCourt(court); setEditing(null); setToast('Quadra salva com sucesso.'); }} />
      <ConfirmDialog open={Boolean(removing)} title="Remover quadra" description={`A quadra ${removing?.name ?? ''} será removida da vitrine demo. Reservas existentes não serão apagadas.`} confirmLabel="Remover" onClose={() => setRemoving(null)} onConfirm={() => { if (removing) removeCourt(removing.id); setRemoving(null); setToast('Quadra removida da vitrine demo.'); }} />
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

function CourtModal({ court, onClose, onSave }: { court: Court | null; onClose: () => void; onSave: (court: Court) => void }) {
  const [draft, setDraft] = useState(court);
  if (!court || !draft) return null;
  const update = (key: keyof Court, value: string | number | boolean) => setDraft((current) => current ? { ...current, [key]: value } : current);
  return (
    <Modal title={court.id ? 'Editar quadra' : 'Nova quadra'} open={Boolean(court)} onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <label className="grid gap-2 text-sm font-semibold">Nome<input className="form-control" value={draft.name} onChange={(event) => update('name', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">Modalidade<select className="form-control" value={draft.modality} onChange={(event) => update('modality', event.target.value)}>{modalities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Preço/h<input className="form-control" type="number" min={1} value={draft.pricePerHour} onChange={(event) => update('pricePerHour', Number(event.target.value))} /></label>
        <label className="grid gap-2 text-sm font-semibold">Capacidade<input className="form-control" type="number" min={1} value={draft.playerCapacity} onChange={(event) => update('playerCapacity', Number(event.target.value))} /></label>
        <label className="grid gap-2 text-sm font-semibold">Status<select className="form-control" value={draft.status} onChange={(event) => update('status', event.target.value)}>{courtStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Localização<input className="form-control" value={draft.location} onChange={(event) => update('location', event.target.value)} /></label>
        <label className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={draft.lighting} onChange={(event) => update('lighting', event.target.checked)} />Iluminação</label>
        <label className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={draft.covered} onChange={(event) => update('covered', event.target.checked)} />Coberta</label>
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">Descrição<textarea className="form-control min-h-24" value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
        <button className="neon-button rounded-lg px-5 py-3 font-black md:col-span-2">Salvar quadra</button>
      </form>
    </Modal>
  );
}

export function AdminReservationsPage() {
  const { state, cancelReservation } = useAppData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReservationStatus | 'Todos'>('Todos');
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState<Reservation | null>(null);
  const [canceling, setCanceling] = useState<Reservation | null>(null);
  const [toast, setToast] = useState('');
  const [toastTone, setToastTone] = useState<'success' | 'danger'>('success');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(
    () =>
      state.reservations.filter((reservation) => {
        const normalized = search.toLowerCase();
        const matchesSearch = [reservation.code, reservation.clientName, reservation.courtName, reservation.modality].some((value) => value.toLowerCase().includes(normalized));
        return matchesSearch && (status === 'Todos' || reservation.status === status);
      }),
    [search, state.reservations, status]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);

  const requestCancel = (reservation: Reservation) => setCanceling(reservation);
  const confirmCancel = () => {
    if (!canceling || !user) return;
    try {
      cancelReservation(canceling.id, user);
      setToastTone('success');
      setToast(`Reserva ${canceling.code} cancelada com sucesso.`);
    } catch (err) {
      setToastTone('danger');
      setToast(err instanceof Error ? err.message : 'Não foi possível cancelar.');
    } finally {
      setCanceling(null);
    }
  };

  return (
    <>
      <PageHeader title="Reservas" subtitle="Busca instantânea, filtros por status, confirmação de cancelamento, pagamento demo e paginação." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Nova reserva</button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="form-control py-2 pl-10 pr-3" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar cliente, quadra, modalidade ou código" />
        </label>
        <label className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <select className="form-control w-auto min-w-44 py-2 pl-10 pr-3" value={status} onChange={(event) => { setStatus(event.target.value as ReservationStatus | 'Todos'); setPage(1); }}>
            <option>Todos</option>
            {reservationStatuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="glass-panel table-shell">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[940px]">
            <thead>
              <tr>
                {['Código', 'Cliente', 'Quadra', 'Data', 'Horário', 'Valor', 'Status', 'Ações'].map((header) => <th key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="font-black">{reservation.code}</td>
                  <td>{reservation.clientName}</td>
                  <td>{reservation.courtName}</td>
                  <td>{reservation.date}</td>
                  <td>{reservation.startTime} - {reservation.endTime}</td>
                  <td>{currency(reservation.totalValue)}</td>
                  <td><StatusBadge status={reservation.status} compact /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="ghost-button rounded-lg p-2" onClick={() => setSelected(reservation)} aria-label="Ver detalhes"><Eye className="h-4 w-4" /></button>
                      <button className="ghost-button rounded-lg p-2" onClick={() => setPaying(reservation)} aria-label="Pagar" disabled={reservation.status === 'Cancelada'}><CreditCard className="h-4 w-4" /></button>
                      <button className="ghost-button rounded-lg p-2" onClick={() => requestCancel(reservation)} aria-label="Cancelar" disabled={['Cancelada', 'Concluída'].includes(reservation.status)}><XCircle className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState title="Nenhuma reserva encontrada" description="Ajuste os filtros ou crie uma nova reserva para preencher a agenda." actionLabel="Nova reserva" onAction={() => setCreating(true)} />}
        </div>
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
            <span className="text-muted">{filtered.length} reservas encontradas</span>
            <div className="flex items-center gap-2">
              <button className="ghost-button rounded-lg px-3 py-1.5 font-bold" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button>
              <span className="text-muted">Página {Math.min(page, totalPages)} de {totalPages}</span>
              <button className="ghost-button rounded-lg px-3 py-1.5 font-bold" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima</button>
            </div>
          </div>
        )}
      </div>
      <Modal title="Detalhes da reserva" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <ReservationDetails reservation={selected} />}</Modal>
      <Modal title="Nova reserva" open={creating} onClose={() => setCreating(false)}>{user && <ReservationForm actor={user} onCreated={() => { setCreating(false); setToastTone('success'); setToast('Reserva criada com sucesso.'); }} />}</Modal>
      <Modal title="Pagamento demo" open={Boolean(paying)} onClose={() => setPaying(null)}>{paying && <PaymentFlow reservation={paying} onPaid={() => { setPaying(null); setToastTone('success'); setToast('Pagamento aprovado e reserva confirmada.'); }} />}</Modal>
      <ConfirmDialog open={Boolean(canceling)} title="Cancelar reserva" description={`Confirme o cancelamento da reserva ${canceling?.code ?? ''}. Esta ação atualiza o status e o pagamento vinculado.`} confirmLabel="Cancelar reserva" onClose={() => setCanceling(null)} onConfirm={confirmCancel} />
      <Toast message={toast} tone={toastTone} onClose={() => setToast('')} />
    </>
  );
}

export function AdminPaymentsPage() {
  const { state } = useAppData();
  const [query, setQuery] = useState('');
  const filtered = state.payments.filter((payment) => `${payment.reservationCode} ${payment.method} ${payment.transactionCode}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <PageHeader title="Pagamentos" subtitle="Controle de PIX, crédito, débito e status de transações demo." />
      <div className="grid gap-4 md:grid-cols-4">
        {(['Aprovado', 'Pendente', 'Recusado', 'Cancelado'] as const).map((status) => <StatCard key={status} title={status} value={state.payments.filter((payment) => payment.status === status).length} icon={CreditCard} tone={status === 'Aprovado' ? 'neon' : status === 'Pendente' ? 'amber' : 'danger'} />)}
      </div>
      <label className="relative my-4 block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="form-control py-2 pl-10 pr-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pagamento, método ou transação" />
      </label>
      <div className="grid gap-3">
        {filtered.slice(0, 16).map((payment) => (
          <div key={payment.id} className="glass-panel card-hover flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <div>
              <p className="font-black">{payment.reservationCode}</p>
              <p className="text-sm text-muted">{payment.method} · {payment.transactionCode}</p>
            </div>
            <div className="text-right">
              <p className="font-black">{currency(payment.amount)}</p>
              <StatusBadge status={payment.status} compact />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState title="Nenhum pagamento encontrado" description="A busca não retornou transações para os filtros atuais." />}
      </div>
    </>
  );
}

export function AdminReportsPage() {
  const { state } = useAppData();
  const monthly = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((month, index) => ({ month, receita: [4200, 5100, 6900, 7450, 8120, 9300][index], reservas: [22, 28, 31, 35, 39, 44][index] }));
  const exportFile = (name: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Receita, ocupação, modalidades, horários de pico e exportações."
        action={
          <div className="flex gap-2">
            <button className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => exportFile('playspace-relatorio.pdf', 'PlaySpace - Relatório PDF demo', 'application/pdf')}><Download className="h-4 w-4" />PDF</button>
            <button className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => exportFile('playspace-relatorio.csv', 'Indicador;Valor\nReceita;7450\nOcupação;68%', 'text/csv')}><FileSpreadsheet className="h-4 w-4" />Excel</button>
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Receita por mês" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid stroke="rgba(148,163,184,.12)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={chartTooltip} />
                <Line dataKey="receita" stroke="#7CFF4F" strokeWidth={3} />
                <Line dataKey="reservas" stroke="#55D6FF" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Ocupação por quadra" />
          <div className="grid gap-3">
            {state.courts.map((court, index) => {
              const percent = 82 - index * 7;
              return (
                <div key={court.id}>
                  <div className="mb-1 flex justify-between text-sm"><span>{court.name}</span><span>{percent}%</span></div>
                  <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-neon transition-all" style={{ width: `${percent}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          ['Horários de pico', '18:00, 19:00 e 20:00'],
          ['Clientes mais ativos', 'Lucas, Marina e Carlos'],
          ['Cancelamentos', String(state.reservations.filter((item) => item.status === 'Cancelada').length)]
        ].map(([title, value]) => <div key={title} className="soft-panel card-hover rounded-lg p-5"><p className="text-sm text-muted">{title}</p><strong className="mt-2 block text-xl">{value}</strong></div>)}
      </div>
    </>
  );
}

export function AdminUsersPage() {
  const { state, saveUser, toggleUserActive } = useAppData();
  const [editing, setEditing] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const blank: User = {
    id: '',
    name: '',
    email: '',
    role: 'CLIENTE',
    active: true,
    profile: { photo: 'NV', bio: '', city: 'São Paulo', memberSince: todayIso(), favoriteModality: 'Beach Tennis', sports: ['Beach Tennis'], level: 'Iniciante', reservationsDone: 0, matchesPlayed: 0, hoursOnCourt: 0, attendanceRate: 100, achievementsUnlocked: 0 }
  };
  const filtered = state.users.filter((item) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader title="Usuários" subtitle="Listar, criar, editar, ativar/inativar e definir perfis." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setEditing(blank)}><Plus className="h-4 w-4" />Novo usuário</button>} />
      <label className="relative mb-4 block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="form-control py-2 pl-10 pr-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuário, e-mail ou perfil" />
      </label>
      <div className="grid gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="glass-panel card-hover flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-neon/15 text-sm font-black text-neon">{item.profile.photo}</div>
              <div>
                <p className="font-black">{item.name}</p>
                <p className="text-sm text-muted">{item.email} · {item.role}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.active ? 'Ativo' : 'Inativo'} compact />
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => toggleUserActive(item.id)}>{item.active ? 'Inativar' : 'Ativar'}</button>
              <button className="ghost-button rounded-lg p-2" onClick={() => setEditing(item)} aria-label="Editar usuário"><Edit3 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState title="Nenhum usuário encontrado" description="Ajuste sua busca ou crie um novo usuário demo." actionLabel="Novo usuário" onAction={() => setEditing(blank)} />}
      <UserModal key={editing?.id || (editing ? 'new' : 'closed')} user={editing} onClose={() => setEditing(null)} onSave={(saved) => { saveUser(saved); setEditing(null); setToast('Usuário salvo com sucesso.'); }} />
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

function UserModal({ user, onClose, onSave }: { user: User | null; onClose: () => void; onSave: (user: User) => void }) {
  const [draft, setDraft] = useState(user);
  if (!user || !draft) return null;
  const update = (key: keyof User, value: string | boolean) => setDraft((current) => current ? { ...current, [key]: value } : current);
  return (
    <Modal title={user.id ? 'Editar usuário' : 'Novo usuário'} open={Boolean(user)} onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, profile: { ...draft.profile, photo: draft.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'US' } }); }}>
        <label className="grid gap-2 text-sm font-semibold">Nome<input className="form-control" value={draft.name} onChange={(event) => update('name', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">E-mail<input className="form-control" type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">Perfil<select className="form-control" value={draft.role} onChange={(event) => update('role', event.target.value as Role)}><option>ADMIN</option><option>CLIENTE</option></select></label>
        <label className="grid gap-2 text-sm font-semibold">Cidade<input className="form-control" value={draft.profile.city} onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, city: event.target.value } } : current)} /></label>
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">Bio<textarea className="form-control min-h-24" value={draft.profile.bio} onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, bio: event.target.value } } : current)} /></label>
        <button className="neon-button rounded-lg px-5 py-3 font-black md:col-span-2">Salvar usuário</button>
      </form>
    </Modal>
  );
}

export function AdminSettingsPage() {
  const { state } = useAppData();
  const [saved, setSaved] = useState('');
  return (
    <>
      <PageHeader title="Configurações" subtitle="Configuração agrupada por empresa, operação, regras e preços padrão." />
      <form className="grid gap-4" onSubmit={(event: FormEvent) => { event.preventDefault(); setSaved('Configurações salvas no modo demo.'); }}>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Empresa" action={<Settings className="h-5 w-5 text-neon" />} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Empresa<input className="form-control" defaultValue={state.settings.company} /></label>
            <label className="grid gap-2 text-sm font-semibold">Funcionamento<input className="form-control" defaultValue={state.settings.hours} /></label>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Regras de reserva" action={<SlidersHorizontal className="h-5 w-5 text-cyan" />} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Cancelamento permitido até<input className="form-control" type="number" defaultValue={state.settings.cancelationRuleHours} /></label>
            <label className="grid gap-2 text-sm font-semibold">Reserva mínima em minutos<input className="form-control" type="number" defaultValue={state.settings.minimumReservationMinutes} /></label>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Modalidades e preços" />
          <div className="mb-4 flex flex-wrap gap-2">{state.settings.modalities.map((item) => <span key={item} className="rounded-full border border-line px-3 py-1 text-sm">{item}</span>)}</div>
          <div className="grid gap-3 md:grid-cols-3">
            {state.settings.modalities.map((item) => (
              <label key={item} className="grid gap-2 text-sm font-semibold">
                {item}
                <input className="form-control" type="number" defaultValue={state.settings.defaultPrices[item]} />
              </label>
            ))}
          </div>
        </section>
        {saved && <p className="rounded-lg border border-neon/30 bg-neon/10 p-3 text-sm text-neon">{saved}</p>}
        <button className="neon-button rounded-lg px-5 py-3 font-black">Salvar configurações</button>
      </form>
    </>
  );
}

export function AdminCommunityPage() {
  const { state, likePost } = useAppData();
  const [toast, setToast] = useState('');
  return (
    <>
      <PageHeader title="Comunidade" subtitle="Feed, parceiros, campeonatos, avaliações e destaques da comunidade." />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Feed da comunidade" />
          <div className="grid gap-3">
            {state.posts.map((post) => (
              <article key={post.id} className="app-card p-4">
                <p><strong>{post.authorName}</strong> {post.content}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => likePost(post.id)}>Curtir · {post.likes}</button>
                  <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => setToast('Comentário demo registrado visualmente.')}>Comentar · {post.comments}</button>
                  <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => { navigator.clipboard?.writeText(post.content); setToast('Publicação copiada.'); }}>Compartilhar</button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="grid gap-4">
          <div className="glass-panel rounded-lg p-5">
            <SectionTitle title="Últimas avaliações" />
            <div className="grid gap-3">
              {state.reviews.map((review) => <p key={review.id} className="app-card p-3 text-sm"><Star className="mr-1 inline h-4 w-4 text-amber" />{review.average} · {review.comment}</p>)}
            </div>
          </div>
          <div className="glass-panel rounded-lg p-5">
            <SectionTitle title="Próximos campeonatos" />
            <div className="grid gap-3">
              {state.championships.map((championship) => <p key={championship.id} className="app-card p-3 text-sm"><strong>{championship.name}</strong><br /><span className="text-muted">{championship.status} · {championship.startDate}</span></p>)}
            </div>
          </div>
        </section>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

export function AdminStatusPage() {
  const [refreshed, setRefreshed] = useState(new Date());
  return (
    <>
      <PageHeader title="Status do sistema" subtitle="Monitor de saúde demo da API, banco, fila e realtime." action={<button className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setRefreshed(new Date())}><RefreshCw className="h-4 w-4" />Atualizar</button>} />
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['API', 'Operacional', ShieldCheck],
          ['Banco de dados', 'Saudável', CheckCircle2],
          ['Realtime', 'Simulado', Activity],
          ['Auditoria', 'Ativa', BarChart3]
        ].map(([title, status, Icon]) => {
          const StatusIcon = Icon as LucideIcon;
          return (
            <div key={String(title)} className="glass-panel card-hover rounded-lg p-5">
              <StatusIcon className="h-6 w-6 text-neon" />
              <p className="mt-4 text-sm text-muted">{String(title)}</p>
              <strong>{String(status)}</strong>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-muted">Última verificação: {refreshed.toLocaleString('pt-BR')}</p>
    </>
  );
}
