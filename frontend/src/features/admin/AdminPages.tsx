import {
  Activity,
  Banknote,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Flame,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Volleyball,
  XCircle
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
const chartColors = ['#7CFF4F', '#55D6FF', '#8B5CF6', '#FFB84D', '#FB7185'];

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-black uppercase text-neon">PlaySpace Admin</p>
        <h1 className="mt-1 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminDashboard() {
  const { state } = useAppData();
  const today = new Date().toISOString().slice(0, 10);
  const todayReservations = state.reservations.filter((item) => item.date === today && item.status !== 'Cancelada');
  const upcoming = state.reservations.filter((item) => item.date >= today && item.status !== 'Cancelada').slice(0, 4);
  const revenue = state.payments.filter((item) => item.status === 'Aprovado').reduce((sum, item) => sum + item.amount, 0);
  const pendingPayments = state.payments.filter((item) => item.status === 'Pendente').length;
  const cancellations = state.reservations.filter((item) => item.status === 'Cancelada').length;
  const byStatus = reservationStatuses.map((status) => ({ name: status, value: state.reservations.filter((item) => item.status === status).length }));
  const byModality = modalities.map((modality) => ({ name: modality, reservas: state.reservations.filter((item) => item.modality === modality).length }));
  const week = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => ({ day, ocupacao: [42, 63, 58, 78, 66, 88, 72][index] }));
  const hours = ['08', '10', '12', '14', '16', '18', '20'].map((hour, index) => ({ hour: `${hour}:00`, reservas: [3, 5, 4, 7, 9, 14, 12][index] }));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Resumo operacional, financeiro e comunitário em tempo real demo." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Reservas hoje" value={todayReservations.length} hint="+12% vs ontem" icon={CalendarDays} />
        <StatCard title="Próximas reservas" value={upcoming.length} hint="ver agenda" icon={CalendarClock} />
        <StatCard title="Receita do mês" value={currency(revenue)} hint="+8,5% vs mês anterior" icon={Banknote} />
        <StatCard title="Taxa de ocupação" value="68%" hint="+11% vs mês anterior" icon={TrendingUp} />
        <StatCard title="Pagamentos pendentes" value={pendingPayments} icon={CreditCard} />
        <StatCard title="Cancelamentos" value={cancellations} icon={XCircle} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        {[
          ['Quadra mais reservada', 'Quadra Aurora', Volleyball],
          ['Horário de maior movimento', '19:00', Clock3],
          ['Modalidade em alta', 'Beach Tennis', Flame],
          ['Jogadores ativos hoje', String(state.users.filter((user) => user.role === 'CLIENTE').length), Users]
        ].map(([title, value, Icon]) => <StatCard key={String(title)} title={String(title)} value={String(value)} icon={Icon as typeof Volleyball} />)}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Próximas reservas</h2>
          <div className="mt-4 grid gap-3">
            {upcoming.map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.03] p-3">
                <div>
                  <p className="font-bold">{reservation.courtName}</p>
                  <p className="text-sm text-muted">{reservation.clientName} · {reservation.date} · {reservation.startTime}</p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>
            ))}
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black">Ocupação da semana</h2>
            <strong className="text-neon">68%</strong>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={week}>
                <CartesianGrid stroke="rgba(148,163,184,.12)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0b1117', border: '1px solid rgba(148,163,184,.2)' }} />
                <Line type="monotone" dataKey="ocupacao" stroke="#7CFF4F" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Reservas por status</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                  {byStatus.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0b1117', border: '1px solid rgba(148,163,184,.2)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Reservas por modalidade</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byModality}>
                <XAxis dataKey="name" hide />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0b1117', border: '1px solid rgba(148,163,184,.2)' }} />
                <Bar dataKey="reservas" fill="#55D6FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Horários mais reservados</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours}>
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0b1117', border: '1px solid rgba(148,163,184,.2)' }} />
                <Bar dataKey="reservas" fill="#7CFF4F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Atividade recente</h2>
          <div className="mt-4 grid gap-3">
            {state.activities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="rounded-lg border border-line bg-white/[0.03] p-3">
                <p className="font-semibold">{activity.action}</p>
                <p className="text-xs text-muted">{activity.actor} · {activity.category}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Clima e comunidade</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg border border-line bg-white/[0.03] p-4">
              <strong className="text-2xl text-neon">27°C</strong>
              <p className="text-sm text-muted">Ideal para Beach Tennis. Quadras abertas recomendadas.</p>
            </div>
            {state.posts.slice(0, 3).map((post) => (
              <p key={post.id} className="rounded-lg border border-line bg-white/[0.03] p-3 text-sm"><strong>{post.authorName}</strong> {post.content}</p>
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
        subtitle="Visualização semanal com filtros por quadra e modalidade."
        action={
          <div className="flex flex-wrap gap-2">
            <select className="rounded-lg border border-line bg-white/5 px-3 py-2 text-sm" value={courtFilter} onChange={(event) => setCourtFilter(event.target.value)}>
              <option>Todas</option>
              {state.courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
            </select>
            <select className="rounded-lg border border-line bg-white/5 px-3 py-2 text-sm" value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value as Modality | 'Todas')}>
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
          <div key={label} className="rounded-lg border border-line bg-white/[0.03] p-3">
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

export function AdminCourtsPage() {
  const { state, saveCourt, removeCourt } = useAppData();
  const [editing, setEditing] = useState<Court | null>(null);
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
      <PageHeader title="Quadras" subtitle="CRUD completo de quadras, status, preço, capacidade e estrutura." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setEditing(blank)}><Plus className="h-4 w-4" />Nova quadra</button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.courts.map((court) => (
          <article key={court.id} className="glass-panel card-hover overflow-hidden rounded-lg">
            <div className="h-32" style={{ background: court.image }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{court.name}</h2>
                  <p className="text-sm text-muted">{court.modality} · {court.location}</p>
                </div>
                <StatusBadge status={court.status} />
              </div>
              <p className="mt-3 text-sm text-muted">{court.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <span className="rounded-lg border border-line p-2">{currency(court.pricePerHour)}/h</span>
                <span className="rounded-lg border border-line p-2">{court.playerCapacity} jogadores</span>
                <span className="rounded-lg border border-line p-2">{court.covered ? 'Coberta' : 'Aberta'}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="ghost-button rounded-lg p-2" onClick={() => setEditing(court)} aria-label={`Editar ${court.name}`}><Edit3 className="h-4 w-4" /></button>
                <button className="ghost-button rounded-lg p-2" onClick={() => { removeCourt(court.id); setToast('Quadra removida da vitrine demo.'); }} aria-label={`Remover ${court.name}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <CourtModal key={editing?.id || (editing ? 'new' : 'closed')} court={editing} onClose={() => setEditing(null)} onSave={(court) => { saveCourt(court); setEditing(null); setToast('Quadra salva com sucesso.'); }} />
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
        <label className="grid gap-2 text-sm font-semibold">Nome<input className="rounded-lg border border-line bg-white/5 p-3" value={draft.name} onChange={(event) => update('name', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">Modalidade<select className="rounded-lg border border-line bg-white/5 p-3" value={draft.modality} onChange={(event) => update('modality', event.target.value)}>{modalities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Preço/h<input className="rounded-lg border border-line bg-white/5 p-3" type="number" value={draft.pricePerHour} onChange={(event) => update('pricePerHour', Number(event.target.value))} /></label>
        <label className="grid gap-2 text-sm font-semibold">Capacidade<input className="rounded-lg border border-line bg-white/5 p-3" type="number" value={draft.playerCapacity} onChange={(event) => update('playerCapacity', Number(event.target.value))} /></label>
        <label className="grid gap-2 text-sm font-semibold">Status<select className="rounded-lg border border-line bg-white/5 p-3" value={draft.status} onChange={(event) => update('status', event.target.value)}>{courtStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Localização<input className="rounded-lg border border-line bg-white/5 p-3" value={draft.location} onChange={(event) => update('location', event.target.value)} /></label>
        <label className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={draft.lighting} onChange={(event) => update('lighting', event.target.checked)} />Iluminação</label>
        <label className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={draft.covered} onChange={(event) => update('covered', event.target.checked)} />Coberta</label>
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">Descrição<textarea className="min-h-24 rounded-lg border border-line bg-white/5 p-3" value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
        <button className="neon-button rounded-lg px-5 py-3 font-black md:col-span-2">Salvar quadra</button>
      </form>
    </Modal>
  );
}

export function AdminReservationsPage() {
  const { state, cancelReservation, payReservation } = useAppData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReservationStatus | 'Todos'>('Todos');
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState<Reservation | null>(null);
  const [toast, setToast] = useState('');
  const filtered = state.reservations.filter((reservation) => {
    const matchesSearch = [reservation.code, reservation.clientName, reservation.courtName].some((value) => value.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && (status === 'Todos' || reservation.status === status);
  });

  const updateStatus = (reservation: Reservation, nextStatus: ReservationStatus) => {
    if (nextStatus === 'Cancelada') cancelReservation(reservation.id, user!);
    else if (nextStatus === 'Confirmada') payReservation(reservation.id, reservation.paymentMethod, true);
    setToast(`Reserva ${reservation.code} atualizada para ${nextStatus}.`);
  };

  return (
    <>
      <PageHeader title="Reservas" subtitle="Busca, filtros, confirmação, cancelamento e pagamento demo." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Nova reserva</button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="w-full rounded-lg border border-line bg-white/5 py-2 pl-10 pr-3" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, quadra ou código" />
        </label>
        <select className="rounded-lg border border-line bg-white/5 px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as ReservationStatus | 'Todos')}>
          <option>Todos</option>
          {reservationStatuses.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="glass-panel overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                {['Código', 'Cliente', 'Quadra', 'Data', 'Horário', 'Valor', 'Status', 'Ações'].map((header) => <th key={header} className="p-3 font-semibold">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((reservation) => (
                <tr key={reservation.id} className="border-b border-line/60">
                  <td className="p-3 font-black">{reservation.code}</td>
                  <td className="p-3">{reservation.clientName}</td>
                  <td className="p-3">{reservation.courtName}</td>
                  <td className="p-3">{reservation.date}</td>
                  <td className="p-3">{reservation.startTime} - {reservation.endTime}</td>
                  <td className="p-3">{currency(reservation.totalValue)}</td>
                  <td className="p-3"><StatusBadge status={reservation.status} /></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="ghost-button rounded-lg p-2" onClick={() => setSelected(reservation)} aria-label="Ver detalhes"><Eye className="h-4 w-4" /></button>
                      <button className="ghost-button rounded-lg p-2" onClick={() => setPaying(reservation)} aria-label="Pagar"><CreditCard className="h-4 w-4" /></button>
                      <button className="ghost-button rounded-lg p-2" onClick={() => updateStatus(reservation, 'Cancelada')} aria-label="Cancelar"><XCircle className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState title="Nenhuma reserva encontrada" description="Ajuste os filtros ou crie uma nova reserva para preencher a agenda." />}
        </div>
      </div>
      <Modal title="Detalhes da reserva" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <ReservationDetails reservation={selected} />}</Modal>
      <Modal title="Nova reserva" open={creating} onClose={() => setCreating(false)}>{user && <ReservationForm actor={user} onCreated={() => { setCreating(false); setToast('Reserva criada com sucesso.'); }} />}</Modal>
      <Modal title="Pagamento demo" open={Boolean(paying)} onClose={() => setPaying(null)}>{paying && <PaymentFlow reservation={paying} onPaid={() => { setPaying(null); setToast('Pagamento aprovado e reserva confirmada.'); }} />}</Modal>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

export function AdminPaymentsPage() {
  const { state } = useAppData();
  return (
    <>
      <PageHeader title="Pagamentos" subtitle="Controle de PIX, crédito, débito e status de transações demo." />
      <div className="grid gap-4 md:grid-cols-4">
        {['Aprovado', 'Pendente', 'Recusado', 'Cancelado'].map((status) => <StatCard key={status} title={status} value={state.payments.filter((payment) => payment.status === status).length} icon={CreditCard} />)}
      </div>
      <div className="mt-4 grid gap-3">
        {state.payments.slice(0, 16).map((payment) => (
          <div key={payment.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <div>
              <p className="font-black">{payment.reservationCode}</p>
              <p className="text-sm text-muted">{payment.method} · {payment.transactionCode}</p>
            </div>
            <div className="text-right">
              <p className="font-black">{currency(payment.amount)}</p>
              <StatusBadge status={payment.status} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function AdminReportsPage() {
  const { state } = useAppData();
  const monthly = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((month, index) => ({ month, receita: [4200, 5100, 6900, 7450, 8120, 9300][index] }));
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
          <h2 className="font-black">Receita por mês</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid stroke="rgba(148,163,184,.12)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0b1117', border: '1px solid rgba(148,163,184,.2)' }} />
                <Line dataKey="receita" stroke="#7CFF4F" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Ocupação por quadra</h2>
          <div className="mt-4 grid gap-3">
            {state.courts.map((court, index) => (
              <div key={court.id}>
                <div className="mb-1 flex justify-between text-sm"><span>{court.name}</span><span>{82 - index * 7}%</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-neon" style={{ width: `${82 - index * 7}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          ['Horários de pico', '18:00, 19:00 e 20:00'],
          ['Clientes mais ativos', 'Lucas, Marina e Carlos'],
          ['Cancelamentos', String(state.reservations.filter((item) => item.status === 'Cancelada').length)]
        ].map(([title, value]) => <div key={title} className="soft-panel rounded-lg p-5"><p className="text-sm text-muted">{title}</p><strong className="mt-2 block text-xl">{value}</strong></div>)}
      </div>
    </>
  );
}

export function AdminUsersPage() {
  const { state, saveUser, toggleUserActive } = useAppData();
  const [editing, setEditing] = useState<User | null>(null);
  const [toast, setToast] = useState('');
  const blank: User = {
    id: '',
    name: '',
    email: '',
    role: 'CLIENTE',
    active: true,
    profile: { photo: 'NV', bio: '', city: 'São Paulo', memberSince: new Date().toISOString().slice(0, 10), favoriteModality: 'Beach Tennis', sports: ['Beach Tennis'], level: 'Iniciante', reservationsDone: 0, matchesPlayed: 0, hoursOnCourt: 0, attendanceRate: 100, achievementsUnlocked: 0 }
  };

  return (
    <>
      <PageHeader title="Usuários" subtitle="Listar, criar, editar, ativar/inativar e definir perfis." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setEditing(blank)}><Plus className="h-4 w-4" />Novo usuário</button>} />
      <div className="grid gap-3">
        {state.users.map((item) => (
          <div key={item.id} className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-neon/15 font-black text-neon">{item.profile.photo}</div>
              <div>
                <p className="font-black">{item.name}</p>
                <p className="text-sm text-muted">{item.email} · {item.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={item.active ? 'Ativo' : 'Inativo'} />
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => toggleUserActive(item.id)}>{item.active ? 'Inativar' : 'Ativar'}</button>
              <button className="ghost-button rounded-lg p-2" onClick={() => setEditing(item)} aria-label="Editar usuário"><Edit3 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
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
        <label className="grid gap-2 text-sm font-semibold">Nome<input className="rounded-lg border border-line bg-white/5 p-3" value={draft.name} onChange={(event) => update('name', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">E-mail<input className="rounded-lg border border-line bg-white/5 p-3" type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">Perfil<select className="rounded-lg border border-line bg-white/5 p-3" value={draft.role} onChange={(event) => update('role', event.target.value as Role)}><option>ADMIN</option><option>CLIENTE</option></select></label>
        <label className="grid gap-2 text-sm font-semibold">Cidade<input className="rounded-lg border border-line bg-white/5 p-3" value={draft.profile.city} onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, city: event.target.value } } : current)} /></label>
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">Bio<textarea className="rounded-lg border border-line bg-white/5 p-3" value={draft.profile.bio} onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, bio: event.target.value } } : current)} /></label>
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
      <PageHeader title="Configurações" subtitle="Dados da empresa, horários, regras de cancelamento e valores padrão." />
      <form className="glass-panel grid gap-4 rounded-lg p-5 md:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); setSaved('Configurações salvas no modo demo.'); }}>
        <label className="grid gap-2 text-sm font-semibold">Empresa<input className="rounded-lg border border-line bg-white/5 p-3" defaultValue={state.settings.company} /></label>
        <label className="grid gap-2 text-sm font-semibold">Funcionamento<input className="rounded-lg border border-line bg-white/5 p-3" defaultValue={state.settings.hours} /></label>
        <label className="grid gap-2 text-sm font-semibold">Regra de cancelamento<input className="rounded-lg border border-line bg-white/5 p-3" type="number" defaultValue={state.settings.cancelationRuleHours} /></label>
        <label className="grid gap-2 text-sm font-semibold">Reserva mínima<input className="rounded-lg border border-line bg-white/5 p-3" type="number" defaultValue={state.settings.minimumReservationMinutes} /></label>
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-semibold">Modalidades disponíveis</p>
          <div className="flex flex-wrap gap-2">{state.settings.modalities.map((item) => <span key={item} className="rounded-full border border-line px-3 py-1 text-sm">{item}</span>)}</div>
        </div>
        {saved && <p className="rounded-lg border border-neon/30 bg-neon/10 p-3 text-sm text-neon md:col-span-2">{saved}</p>}
        <button className="neon-button rounded-lg px-5 py-3 font-black md:col-span-2">Salvar configurações</button>
      </form>
    </>
  );
}

export function AdminCommunityPage() {
  const { state, likePost } = useAppData();
  return (
    <>
      <PageHeader title="Comunidade" subtitle="Feed, parceiros, campeonatos, avaliações e destaques da comunidade." />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Feed da comunidade</h2>
          <div className="mt-4 grid gap-3">
            {state.posts.map((post) => (
              <article key={post.id} className="rounded-lg border border-line bg-white/[0.03] p-4">
                <p><strong>{post.authorName}</strong> {post.content}</p>
                <div className="mt-3 flex gap-2">
                  <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => likePost(post.id)}>Curtir · {post.likes}</button>
                  <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => window.alert('Comentário demo registrado visualmente.')}>Comentar · {post.comments}</button>
                  <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => navigator.clipboard?.writeText(post.content)}>Compartilhar</button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="grid gap-4">
          <div className="glass-panel rounded-lg p-5">
            <h2 className="font-black">Últimas avaliações</h2>
            <div className="mt-4 grid gap-3">
              {state.reviews.map((review) => <p key={review.id} className="rounded-lg border border-line p-3 text-sm"><Star className="mr-1 inline h-4 w-4 text-amber" />{review.average} · {review.comment}</p>)}
            </div>
          </div>
          <div className="glass-panel rounded-lg p-5">
            <h2 className="font-black">Próximos campeonatos</h2>
            <div className="mt-4 grid gap-3">
              {state.championships.map((championship) => <p key={championship.id} className="rounded-lg border border-line p-3 text-sm"><strong>{championship.name}</strong><br /><span className="text-muted">{championship.status} · {championship.startDate}</span></p>)}
            </div>
          </div>
        </section>
      </div>
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
          ['API', 'Operacional'],
          ['Banco de dados', 'Saudável'],
          ['Realtime', 'Simulado'],
          ['Auditoria', 'Ativa']
        ].map(([title, status]) => <div key={title} className="glass-panel rounded-lg p-5"><CheckCircle2 className="h-6 w-6 text-neon" /><p className="mt-4 text-sm text-muted">{title}</p><strong>{status}</strong></div>)}
      </div>
      <p className="mt-4 text-sm text-muted">Última verificação: {refreshed.toLocaleString('pt-BR')}</p>
    </>
  );
}
