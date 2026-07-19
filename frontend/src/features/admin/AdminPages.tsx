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
  Printer,
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
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Avatar } from '../../components/Avatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CourtImage, getSafeCourtImageSource } from '../../components/CourtImage';
import { EmptyState } from '../../components/EmptyState';
import { IconField } from '../../components/IconField';
import { Modal } from '../../components/Modal';
import { PaymentFlow } from '../../components/PaymentFlow';
import { ReservationForm } from '../../components/ReservationForm';
import { ReservationStatusDonut } from '../../components/ReservationStatusDonut';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Toast } from '../../components/Toast';
import { Tooltip as UiTooltip } from '../../components/Tooltip';
import { WeeklyCalendar } from '../../components/WeeklyCalendar';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchSystemStatus, tokenFromStorage } from '../../lib/api';
import { reservationStatusOrder } from '../../lib/status';
import type { Court, CourtStatus, Modality, Payment, PaymentStatus, Reservation, ReservationFormInput, ReservationStatus, Role, User } from '../../lib/types';
import { aggregatePeakHours, aggregateReservationsByModality, formatModalityName } from './dashboardAnalytics';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const courtStatuses: CourtStatus[] = ['Disponível', 'Em manutenção', 'Indisponível'];
const reservationStatuses: ReservationStatus[] = [...reservationStatusOrder];
const reservationTransitions: Record<ReservationStatus, ReservationStatus[]> = {
  Pendente: ['Confirmada'],
  Confirmada: ['Em andamento', 'Concluída'],
  'Em andamento': ['Concluída'],
  Cancelada: ['Pendente'],
  Concluída: []
};
const chartTooltip = { background: 'var(--tooltip-bg)', color: 'var(--tooltip-text)', border: '1px solid var(--border-strong)', borderRadius: 10, boxShadow: 'var(--shadow-panel)' };
const sentenceCase = (value: string) => {
  const normalized = value.trim();
  return normalized ? normalized[0].toLocaleUpperCase('pt-BR') + normalized.slice(1) : '';
};
const humanizeCategory = (value: string) => sentenceCase(value.replace(/_/g, ' ').toLocaleLowerCase('pt-BR'));

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

function ChartEmptyState({ description }: { description: string }) {
  return (
    <div className="grid h-full min-h-[17rem] place-items-center rounded-lg border border-dashed border-line bg-[var(--surface-1)] p-5 text-center">
      <div>
        <BarChart3 className="mx-auto h-7 w-7 text-muted" aria-hidden="true" />
        <p className="mt-3 font-bold">Sem dados no período</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

function ReservationDetails({ reservation }: { reservation: Reservation }) {
  const { state } = useAppData();
  const client = state.users.find((item) => item.id === reservation.clientId);
  const court = state.courts.find((item) => item.id === reservation.courtId);
  const duration = minutesBetween(reservation.startTime, reservation.endTime);
  return (
    <div className="grid gap-4">
      <div className="grid overflow-hidden rounded-lg border border-line sm:grid-cols-[.8fr_1.2fr]">
        <CourtImage courtId={reservation.courtId} courtName={reservation.courtName} modality={reservation.modality} image={court?.image} className="h-full min-h-40 border-b border-line sm:border-b-0 sm:border-r" />
        <div className="flex flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-neon">{reservation.modality}</p><h3 className="mt-1 text-2xl font-black">{reservation.code}</h3><p className="mt-1 text-sm text-muted">{reservation.courtName}</p></div><StatusBadge status={reservation.status} /></div>
          <div className="mt-5 flex items-center gap-3"><Avatar name={reservation.clientName} src={client?.profile.photo} size={42} /><div><p className="font-bold">{reservation.clientName}</p><p className="text-xs text-muted">{client?.email ?? 'Cliente PlaySpace'}</p></div></div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['Data', new Date(`${reservation.date}T12:00:00`).toLocaleDateString('pt-BR')],
          ['Horário', `${reservation.startTime} - ${reservation.endTime}`],
          ['Duração', `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}min` : ''}`],
          ['Jogadores', `${reservation.players}${court ? ` de ${court.playerCapacity}` : ''}`],
          ['Pagamento', reservation.paymentMethod],
          ['Valor', currency(reservation.totalValue)]
        ].map(([label, value]) => (
          <div key={label} className="app-card p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-bold">{value}</p>
          </div>
        ))}
      </div>
      {reservation.notes && <div className="rounded-lg border border-line bg-[var(--surface-1)] p-4"><p className="text-xs font-bold uppercase text-muted">Observações</p><p className="mt-2 text-sm">{reservation.notes}</p></div>}
      <div className="rounded-lg border border-line p-4">
        <p className="text-xs font-bold uppercase text-muted">Histórico da reserva</p>
        <ol className="mt-4 grid gap-3">
          {reservation.history.map((event, index) => <li key={`${event}-${index}`} className="relative flex gap-3 text-sm before:mt-1.5 before:h-2.5 before:w-2.5 before:shrink-0 before:rounded-full before:bg-neon"><span>{event}</span></li>)}
        </ol>
      </div>
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
    const nowKey = `${today} ${new Date().toTimeString().slice(0, 5)}`;
    const upcoming = activeReservations
      .filter((item) => `${item.date} ${item.endTime}` > nowKey)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
      .slice(0, 5);
    const monthKey = today.slice(0, 7);
    const revenue = state.payments.filter((item) => item.status === 'Aprovado' && (item.paidAt ?? today).slice(0, 7) === monthKey).reduce((sum, item) => sum + item.amount, 0);
    const occupiedHours = weekReservations.reduce((sum, item) => sum + Math.max(0, minutesBetween(item.startTime, item.endTime)) / 60, 0);
    const [fallbackOpening = '08:00', fallbackClosing = '22:00'] = state.settings.hours.split(' - ').map((value) => value.trim());
    const openingTime = state.settings.openingTime ?? fallbackOpening;
    const closingTime = state.settings.closingTime ?? fallbackClosing;
    const configuredDailyHours = minutesBetween(openingTime, closingTime) / 60;
    const dailyAvailableHours = Number.isFinite(configuredDailyHours) && configuredDailyHours > 0 ? configuredDailyHours : 14;
    const weekdayKeys = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
    const operatingDays = new Set(state.settings.operatingDays ?? weekdayKeys);
    const operatingDaysInWeek = weekDays.filter((day) => operatingDays.has(weekdayKeys[new Date(`${day}T12:00:00`).getDay()])).length;
    const totalAvailableHours = Math.max(1, state.courts.filter((court) => court.status === 'Disponível').length * dailyAvailableHours * operatingDaysInWeek);
    const occupancy = Math.min(100, Math.round((occupiedHours / totalAvailableHours) * 100));
    const cancellations = state.reservations.filter((item) => item.status === 'Cancelada').length;
    const byStatus = reservationStatuses.map((status) => ({ name: status, value: state.reservations.filter((item) => item.status === status).length }));
    const byModality = aggregateReservationsByModality(activeReservations, [
      ...state.modalityCatalog.filter((item) => item.active).map((item) => item.name),
      ...state.courts.map((court) => court.modality)
    ]);
    const approvedRevenue = new Map(
      state.payments
        .filter((payment) => payment.status === 'Aprovado')
        .map((payment) => [payment.reservationId, payment.amount])
    );
    const daily = weekDays.map((day) => ({
      day: sentenceCase(new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })),
      reservas: weekReservations.filter((item) => item.date === day).length,
      receita: weekReservations
        .filter((item) => item.date === day)
        .reduce((sum, item) => sum + (approvedRevenue.get(item.id) ?? 0), 0)
    }));
    const peakHours = aggregatePeakHours(activeReservations, 6);
    const mostBookedCourt = [...state.courts]
      .map((court) => ({ court, count: activeReservations.filter((item) => item.courtId === court.id).length }))
      .sort((a, b) => b.count - a.count)[0]?.court.name ?? '-';

    const visibleModalities = byModality;
    const maxDailyReservations = Math.max(1, ...daily.map((item) => item.reservas));
    const maxDailyRevenue = Math.max(100, ...daily.map((item) => item.receita));

    return { todayReservations, weekReservations, upcoming, revenue, occupancy, cancellations, byStatus, byModality, visibleModalities, daily, peakHours, mostBookedCourt, maxDailyReservations, maxDailyRevenue };
  }, [state.courts, state.modalityCatalog, state.payments, state.reservations, state.settings]);

  const executives: Array<[string, string, LucideIcon, 'neon' | 'cyan' | 'amber' | 'danger']> = [
    ['Quadra mais reservada', data.mostBookedCourt, Volleyball, 'neon'],
    ['Horário de maior movimento', data.peakHours[0]?.hour ?? '-', Clock3, 'cyan'],
    ['Modalidade em alta', [...data.byModality].sort((a, b) => b.reservas - a.reservas)[0]?.name ?? '-', Flame, 'amber'],
    ['Jogadores ativos', String(state.users.filter((user) => user.role === 'CLIENTE' && user.active).length), Users, 'neon']
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Painel executivo com operação, receita, ocupação, cancelamentos e agenda futura." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-6">
        <StatCard title="Reservas hoje" value={data.todayReservations.length} hint="Calculado pela agenda de hoje" icon={CalendarDays} tone="neon" />
        <StatCard title="Reservas da semana" value={data.weekReservations.length} hint="Segunda a domingo" icon={CalendarClock} tone="cyan" />
        <StatCard title="Taxa de ocupação" value={`${data.occupancy}%`} hint="Horas ocupadas ÷ horas disponíveis" icon={TrendingUp} tone="neon" />
        <StatCard title="Receita do mês" value={currency(data.revenue)} hint="Somente pagamentos aprovados" icon={Banknote} tone="amber" />
        <StatCard title="Cancelamentos" value={data.cancellations} hint="Total no período demonstrado" icon={XCircle} tone="danger" />
        <StatCard title="Próximas reservas" value={data.upcoming.length} hint="Sem incluir horários passados" icon={Clock3} tone="cyan" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        {executives.map(([title, value, Icon, tone]) => <StatCard key={title} title={title} value={value} icon={Icon} tone={tone} />)}
      </div>

      <div className="mt-4 grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.3fr)]">
        <section className="glass-panel flex h-full min-w-0 flex-col rounded-lg p-5">
          <SectionTitle title="Próximas reservas" action={<StatusBadge status="Confirmada" compact />} />
          <div className="grid flex-1 content-start gap-3">
            {data.upcoming.map((reservation) => (
              <div key={reservation.id} className="app-card flex min-w-0 flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                <Avatar name={reservation.clientName} src={state.users.find((item) => item.id === reservation.clientId)?.profile.photo} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{reservation.courtName}</p>
                  <p className="truncate text-sm text-muted">{reservation.clientName} · {new Date(`${reservation.date}T12:00:00`).toLocaleDateString('pt-BR')} · {reservation.startTime}</p>
                </div>
                <span className="shrink-0"><StatusBadge status={reservation.status} compact /></span>
              </div>
            ))}
            {data.upcoming.length === 0 && <EmptyState title="Sem reservas futuras" description="Novas reservas aparecerão aqui em tempo real." />}
          </div>
        </section>
        <section className="glass-panel flex h-full min-h-[24rem] min-w-0 flex-col overflow-hidden rounded-lg p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black">Reservas e receita da semana</h2>
              <p className="mt-1 text-xs leading-5 text-muted">Segunda a domingo · receita de pagamentos aprovados</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-neon/25 bg-neon/10 px-3 py-1.5 text-xs font-black text-neon" aria-label={`${data.occupancy}% de ocupação na semana`}>
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              {data.occupancy}% ocupação
            </span>
          </div>
          {data.weekReservations.length === 0
            ? <ChartEmptyState description="As reservas confirmadas desta semana aparecerão aqui com a receita correspondente." />
            : <>
              <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-muted" aria-label="Legenda do gráfico semanal">
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-neon" aria-hidden="true" />Reservas</span>
                <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 rounded-full bg-cyan" aria-hidden="true" />Receita aprovada</span>
              </div>
              <div className="min-h-[18rem] min-w-0 flex-1" role="img" aria-label="Gráfico de reservas e receita aprovada por dia da semana">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.daily} margin={{ top: 14, right: 2, bottom: 2, left: 0 }}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--muted)" interval={0} minTickGap={4} tick={{ fontSize: 12, fontWeight: 600 }} tickMargin={11} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="reservas" stroke="var(--primary)" allowDecimals={false} domain={[0, data.maxDailyReservations]} width={34} tick={{ fontSize: 12 }} tickMargin={6} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="receita" orientation="right" stroke="var(--info)" domain={[0, data.maxDailyRevenue]} width={64} tick={{ fontSize: 12 }} tickMargin={6} tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { notation: 'compact' })}`} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={chartTooltip} labelFormatter={(label) => `Dia: ${label}`} formatter={(value, name) => name === 'receita' ? [currency(Number(value)), 'Receita'] : [`${value} ${Number(value) === 1 ? 'reserva' : 'reservas'}`, 'Reservas']} />
                    <Bar yAxisId="reservas" dataKey="reservas" fill="var(--primary)" fillOpacity={0.82} radius={[5, 5, 0, 0]} maxBarSize={32} />
                    <Line yAxisId="receita" type="monotone" dataKey="receita" stroke="var(--info)" strokeWidth={3} dot={{ r: 3.5, fill: 'var(--surface-elevated)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <ul className="sr-only" aria-label="Dados do gráfico semanal">{data.daily.map((item) => <li key={item.day}>{item.day}: {item.reservas} reservas e {currency(item.receita)} de receita aprovada</li>)}</ul>
            </>}
        </section>
      </div>

      <div className="mt-4 grid min-w-0 items-stretch gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <section className="glass-panel flex h-full min-h-[26rem] min-w-0 flex-col rounded-lg p-4 sm:p-5">
          <SectionTitle title="Reservas por status" />
          <ReservationStatusDonut data={data.byStatus} />
        </section>
        <section className="glass-panel flex h-full min-h-[26rem] min-w-0 flex-col overflow-hidden rounded-lg p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black">Reservas por modalidade</h2>
              <p className="mt-1 text-xs leading-5 text-muted">Reservas não canceladas · atualização automática</p>
            </div>
            {data.visibleModalities.length > 0 && <span className="shrink-0 rounded-full border border-cyan/25 bg-cyan/10 px-2.5 py-1 text-xs font-black text-cyan">{data.visibleModalities.length} {data.visibleModalities.length === 1 ? 'modalidade' : 'modalidades'}</span>}
          </div>
          {data.visibleModalities.length === 0
            ? <ChartEmptyState description="O comparativo será exibido após a primeira reserva do período." />
            : <>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1" role="img" aria-label={`Gráfico com ${data.visibleModalities.length} modalidades e suas reservas`}>
                <div className="h-full min-w-0" style={{ minHeight: Math.max(288, data.visibleModalities.length * 48) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.visibleModalities} layout="vertical" margin={{ top: 6, right: 34, bottom: 8, left: 0 }} barCategoryGap="26%">
                      <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" horizontal={false} />
                      <XAxis type="number" stroke="var(--muted)" allowDecimals={false} domain={[0, 'dataMax']} tick={{ fontSize: 12 }} tickMargin={8} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" stroke="var(--muted)" width={136} tick={{ fontSize: 13, fontWeight: 600 }} tickMargin={10} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={chartTooltip} formatter={(value) => [`${value} ${Number(value) === 1 ? 'reserva' : 'reservas'}`, 'Total']} cursor={{ fill: 'var(--surface-hover)' }} />
                      <Bar dataKey="reservas" fill="var(--info)" radius={[0, 7, 7, 0]} maxBarSize={28}>
                        <LabelList dataKey="reservas" position="right" fill="var(--text)" fontSize={12} fontWeight={800} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <ul className="sr-only" aria-label="Dados de reservas por modalidade">{data.visibleModalities.map((item) => <li key={item.key}>{item.name}: {item.reservas} {item.reservas === 1 ? 'reserva' : 'reservas'}</li>)}</ul>
            </>}
        </section>
        <section className="glass-panel flex h-full min-h-[26rem] min-w-0 flex-col overflow-hidden rounded-lg p-4 sm:p-5 xl:col-span-2 2xl:col-span-1">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black">Horários mais utilizados</h2>
              <p className="mt-1 text-xs leading-5 text-muted">Top 6 em ordem decrescente de procura</p>
            </div>
            {data.peakHours.length > 0 && <span className="shrink-0 rounded-full border border-neon/25 bg-neon/10 px-2.5 py-1 text-xs font-black text-neon">Mais usado: {data.peakHours[0].label}</span>}
          </div>
          {data.peakHours.length === 0
            ? <ChartEmptyState description="Os horários de maior procura serão calculados automaticamente." />
            : <>
              <div className="min-h-[18rem] min-w-0 flex-1" role="img" aria-label="Gráfico dos seis horários mais utilizados em ordem de procura">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peakHours} margin={{ top: 28, right: 8, bottom: 4, left: 0 }} barCategoryGap="24%">
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--muted)" interval={0} tick={{ fontSize: 13, fontWeight: 700 }} tickMargin={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted)" allowDecimals={false} domain={[0, 'dataMax']} width={34} tick={{ fontSize: 12 }} tickMargin={6} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={chartTooltip} labelFormatter={(_, payload) => `Horário: ${payload?.[0]?.payload?.hour ?? ''}`} formatter={(value) => [`${value} ${Number(value) === 1 ? 'reserva' : 'reservas'}`, 'Total']} cursor={{ fill: 'var(--surface-hover)' }} />
                    <Bar dataKey="reservas" fill="var(--primary)" radius={[7, 7, 0, 0]} maxBarSize={48}>
                      <LabelList dataKey="reservas" position="top" fill="var(--text)" fontSize={12} fontWeight={800} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="sr-only" aria-label="Dados dos horários mais utilizados">{data.peakHours.map((item) => <li key={item.hour}>{item.hour}: {item.reservas} {item.reservas === 1 ? 'reserva' : 'reservas'}</li>)}</ul>
            </>}
        </section>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Atividade recente" />
          <div className="grid gap-3">
            {state.activities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="app-card p-3">
                <p className="font-semibold">{sentenceCase(activity.action)}</p>
                <p className="text-xs text-muted">{activity.actor} · {humanizeCategory(activity.category)} · {new Date(activity.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
            ))}
            {state.activities.length === 0 && <EmptyState title="Nenhuma atividade registrada" description="O histórico aparecerá aqui assim que a API registrar uma ação operacional." />}
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Comunidade e clima" />
          <div className="grid gap-3">
            <div className="app-card p-4">
              <div className="flex items-center justify-between gap-3"><strong className="text-2xl text-neon">27°C</strong><StatusBadge status="Demonstração" compact /></div>
              <p className="text-sm text-muted">Condição simulada para São Paulo. Quadras abertas recomendadas.</p>
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
  const filterModalities = state.modalityCatalog.map((item) => item.name);
  const { user } = useAuth();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const [reservationDraft, setReservationDraft] = useState<Partial<ReservationFormInput>>({});
  const [courtFilter, setCourtFilter] = useState('Todas');
  const [modalityFilter, setModalityFilter] = useState<Modality | 'Todas'>('Todas');

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Calendário semanal profissional com filtros, legenda, horário atual e feedback ao selecionar janelas livres."
        action={
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold text-muted">
              Quadra
            <select className="form-control w-full min-w-44 px-3 py-2 text-sm" value={courtFilter} onChange={(event) => setCourtFilter(event.target.value)} aria-label="Filtrar agenda por quadra">
              <option value="Todas">Todas as quadras</option>
              {state.courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
            </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-muted">
              Modalidade
            <select className="form-control w-full min-w-44 px-3 py-2 text-sm" value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value as Modality | 'Todas')} aria-label="Filtrar agenda por modalidade">
              <option value="Todas">Todas as modalidades</option>
              {filterModalities.map((modality) => <option key={modality}>{modality}</option>)}
            </select>
            </label>
          </div>
        }
      />
      <WeeklyCalendar reservations={state.reservations} courtFilter={courtFilter} modalityFilter={modalityFilter} onReservationClick={setSelected} onNewReservation={(initialValues) => { setReservationDraft(initialValues ?? {}); setCreating(true); }} />
      <Modal title="Detalhes da reserva" open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && <ReservationDetails reservation={selected} />}
      </Modal>
      <Modal title="Nova reserva" open={creating} onClose={() => setCreating(false)}>
        {user && <ReservationForm actor={user} initialValues={reservationDraft} onCreated={() => { setCreating(false); setReservationDraft({}); }} />}
      </Modal>
    </>
  );
}

export function AdminCourtsPage() {
  const { state, dataSource, saveCourt, removeCourt } = useAppData();
  const activeModalities = state.modalityCatalog.filter((item) => item.active).map((item) => item.name);
  const defaultModality = activeModalities[0] ?? ('' as Modality);
  const [editing, setEditing] = useState<Court | null>(null);
  const [removing, setRemoving] = useState<Court | null>(null);
  const [toast, setToast] = useState('');
  const [toastTone, setToastTone] = useState<'success' | 'danger'>('success');
  const blank: Court = {
    id: '',
    name: '',
    modality: defaultModality,
    description: '',
    pricePerHour: state.modalityCatalog.find((item) => item.name === defaultModality)?.defaultPrice ?? 120,
    playerCapacity: 4,
    status: 'Disponível',
    image: '',
    location: '',
    lighting: true,
    covered: false,
    rating: 0
  };

  return (
    <>
      <PageHeader title="Quadras" subtitle="Gestão de quadras, status, preço, capacidade e estrutura com cards consistentes." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setEditing(blank)}><Plus className="h-4 w-4" />Nova quadra</button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.courts.map((court) => (
          <article key={court.id} className="glass-panel card-hover overflow-hidden rounded-lg">
            <CourtImage courtId={court.id} courtName={court.name} modality={court.modality} image={court.image} className="aspect-[16/8] border-b border-line" />
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
                <UiTooltip content={`Editar ${court.name}`}><button className="ghost-button rounded-lg p-2" onClick={() => setEditing(court)} aria-label={`Editar ${court.name}`}><Edit3 className="h-4 w-4" /></button></UiTooltip>
                <UiTooltip content="Inativar preservando o histórico"><button className="ghost-button rounded-lg p-2" onClick={() => setRemoving(court)} aria-label={`Inativar ${court.name}`}><Trash2 className="h-4 w-4" /></button></UiTooltip>
              </div>
            </div>
          </article>
        ))}
      </div>
      <CourtModal key={editing?.id || (editing ? 'new' : 'closed')} court={editing} modalityOptions={activeModalities} allowUpload={dataSource === 'demo'} onClose={() => setEditing(null)} onSave={async (court) => {
        try { await saveCourt(court); setEditing(null); setToastTone('success'); setToast('Quadra salva com sucesso.'); }
        catch (error) { setToastTone('danger'); setToast(error instanceof Error ? error.message : 'Não foi possível salvar a quadra.'); }
      }} />
      <ConfirmDialog open={Boolean(removing)} title="Inativar quadra" description={`A quadra ${removing?.name ?? ''} ficará indisponível para novas reservas. Todo o histórico será preservado.`} confirmLabel="Inativar quadra" onClose={() => setRemoving(null)} onConfirm={async () => {
        if (!removing) return;
        try { await removeCourt(removing.id); setToastTone('success'); setToast('Quadra inativada com histórico preservado.'); setRemoving(null); }
        catch (error) { setToastTone('danger'); setToast(error instanceof Error ? error.message : 'Não foi possível inativar a quadra.'); }
      }} />
      <Toast message={toast} tone={toastTone} onClose={() => setToast('')} />
    </>
  );
}

function CourtModal({ court, modalityOptions, allowUpload, onClose, onSave }: { court: Court | null; modalityOptions: Modality[]; allowUpload: boolean; onClose: () => void; onSave: (court: Court) => void | Promise<void> }) {
  const [draft, setDraft] = useState<Court | null>(() => court ? { ...court, image: getSafeCourtImageSource(court.image) ? court.image : '' } : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!court || !draft) return null;
  const update = (key: keyof Court, value: string | number | boolean) => setDraft((current) => current ? { ...current, [key]: value } : current);
  const imageIsDataUri = draft.image.startsWith('data:image/');
  const handleImageUpload = (file?: File) => {
    setError('');
    if (!file) return;
    if (!allowUpload) {
      setError('O upload local de imagem está disponível apenas no modo demonstração. Use uma URL pública.');
      return;
    }
    if (!['image/avif', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use uma imagem AVIF, JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('A imagem deve ter no máximo 1,5 MB para não comprometer o armazenamento local.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && getSafeCourtImageSource(reader.result)) update('image', reader.result);
      else setError('Não foi possível validar a imagem selecionada.');
    };
    reader.onerror = () => setError('Não foi possível ler a imagem selecionada.');
    reader.readAsDataURL(file);
  };
  return (
    <Modal title={court.id ? 'Editar quadra' : 'Nova quadra'} open={Boolean(court)} onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); setError(''); const normalizedModality = formatModalityName(draft.modality); if (!normalizedModality) { setError('Informe a modalidade da quadra.'); return; } if (draft.image && !getSafeCourtImageSource(draft.image)) { setError('Informe uma URL de imagem HTTP ou HTTPS válida.'); return; } setSaving(true); try { await onSave({ ...draft, modality: normalizedModality }); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.'); } finally { setSaving(false); } }}>
        <label className="grid gap-2 text-sm font-semibold">Nome<input className="form-control" value={draft.name} onChange={(event) => update('name', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">
          Modalidade
          <input className="form-control" list="court-modality-options" value={draft.modality} onChange={(event) => update('modality', event.target.value)} maxLength={80} required />
          <datalist id="court-modality-options">{modalityOptions.map((item) => <option key={item} value={item} />)}</datalist>
          <span className="text-xs font-normal leading-5 text-muted">Escolha uma opção ativa ou informe uma nova modalidade; ela será cadastrada antes da quadra.</span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Preço/h<input className="form-control" type="number" min={1} value={draft.pricePerHour} onChange={(event) => update('pricePerHour', Number(event.target.value))} /></label>
        <label className="grid gap-2 text-sm font-semibold">Capacidade<input className="form-control" type="number" min={1} value={draft.playerCapacity} onChange={(event) => update('playerCapacity', Number(event.target.value))} /></label>
        <label className="grid gap-2 text-sm font-semibold">Status<select className="form-control" value={draft.status} onChange={(event) => update('status', event.target.value)}>{courtStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Localização<input className="form-control" value={draft.location} onChange={(event) => update('location', event.target.value)} /></label>
        <label className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={draft.lighting} onChange={(event) => update('lighting', event.target.checked)} />Iluminação</label>
        <label className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={draft.covered} onChange={(event) => update('covered', event.target.checked)} />Coberta</label>
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">Descrição<textarea className="form-control min-h-24" value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
        <div className="grid gap-3 rounded-lg border border-line p-3 md:col-span-2 md:grid-cols-[minmax(0,1fr)_11rem] md:items-start">
          <div className="grid min-w-0 gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              URL da imagem
              <input className="form-control min-w-0" type="url" inputMode="url" placeholder={imageIsDataUri ? 'Imagem enviada do dispositivo' : 'https://exemplo.com/quadra.webp'} value={imageIsDataUri ? '' : draft.image} onChange={(event) => { setError(''); update('image', event.target.value); }} />
            </label>
            {allowUpload && <label className="grid gap-2 text-sm font-semibold">
              Upload no modo demo
              <input className="form-control min-w-0 text-xs" type="file" accept="image/avif,image/jpeg,image/png,image/webp" onChange={(event) => handleImageUpload(event.target.files?.[0])} />
              <span className="text-xs font-normal leading-5 text-muted">AVIF, JPEG, PNG ou WebP, com até 1,5 MB. A imagem fica armazenada apenas neste navegador.</span>
            </label>}
            {!allowUpload && <p className="text-xs leading-5 text-muted">No modo conectado, informe uma URL pública HTTP ou HTTPS. O upload local fica restrito à demonstração.</p>}
            {draft.image && <button className="ghost-button w-fit rounded-lg px-3 py-2 text-xs font-bold" type="button" onClick={() => { update('image', ''); setError(''); }}>Remover imagem</button>}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Pré-visualização</p>
            <CourtImage courtId={draft.id || 'new-court-preview'} courtName={draft.name || 'Nova quadra'} modality={draft.modality} image={draft.image} className="aspect-[4/3] rounded-lg border border-line" />
          </div>
        </div>
        {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)] md:col-span-2" role="alert">{error}</p>}
        <button className="neon-button rounded-lg px-5 py-3 font-black disabled:opacity-60 md:col-span-2" disabled={saving}>{saving ? 'Salvando quadra...' : 'Salvar quadra'}</button>
      </form>
    </Modal>
  );
}

export function AdminReservationsPage() {
  const { state, cancelReservation, changeReservationStatus } = useAppData();
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
  const [pageSize, setPageSize] = useState(8);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const reservationId = searchParams.get('reserva');
    if (!reservationId) return;
    const reservation = state.reservations.find((item) => item.id === reservationId);
    if (reservation) setSelected(reservation);
    const next = new URLSearchParams(searchParams);
    next.delete('reserva');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, state.reservations]);

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
  const updateStatus = async (reservation: Reservation, nextStatus: ReservationStatus) => {
    if (!user || nextStatus === reservation.status) return;
    setStatusUpdating(reservation.id);
    try {
      await changeReservationStatus(reservation.id, nextStatus, user);
      setToastTone('success');
      setToast(`Reserva ${reservation.code} atualizada para ${nextStatus}.`);
    } catch (reason) {
      setToastTone('danger');
      setToast(reason instanceof Error ? reason.message : 'Não foi possível atualizar o status.');
    } finally {
      setStatusUpdating(null);
    }
  };
  const confirmCancel = async () => {
    if (!canceling || !user) return;
    try {
      await cancelReservation(canceling.id, user);
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
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto] sm:items-end">
        <IconField label="Buscar reservas" leadingIcon={<Search className="h-4 w-4" />} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cliente, quadra, modalidade ou código" />
        <label className="grid gap-2 text-sm font-semibold">
          Status
          <select className="form-control min-w-48 py-2" value={status} onChange={(event) => { setStatus(event.target.value as ReservationStatus | 'Todos'); setPage(1); }}>
            <option value="Todos">Todos os status</option>
            {reservationStatuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="glass-panel table-shell">
        <p className="border-b border-line px-4 py-3 text-xs font-semibold text-muted md:hidden">Deslize a tabela horizontalmente; a coluna de ações permanece visível.</p>
        <div className="overflow-x-auto">
          <table className="data-table responsive-data-table min-w-[940px]">
            <thead>
              <tr>
                {['Código', 'Cliente', 'Quadra', 'Data', 'Horário', 'Valor', 'Status', 'Ações'].map((header) => <th key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {visible.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="font-black">{reservation.code}</td>
                  <td><span className="flex items-center gap-2"><Avatar name={reservation.clientName} src={state.users.find((item) => item.id === reservation.clientId)?.profile.photo} size={32} /><span>{reservation.clientName}</span></span></td>
                  <td>{reservation.courtName}</td>
                  <td>{reservation.date}</td>
                  <td>{reservation.startTime} - {reservation.endTime}</td>
                  <td>{currency(reservation.totalValue)}</td>
                  <td><StatusBadge status={reservation.status} compact /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      {reservationTransitions[reservation.status].length > 0 && <select className="form-control min-w-36 py-2 text-xs" value="" disabled={statusUpdating === reservation.id} onChange={(event) => { if (event.target.value) void updateStatus(reservation, event.target.value as ReservationStatus); }} aria-label={`Alterar status de ${reservation.code}`}><option value="">Alterar status</option>{reservationTransitions[reservation.status].map((item) => <option key={item} value={item}>{item}</option>)}</select>}
                      <UiTooltip content="Visualizar"><button className="ghost-button rounded-lg p-2" onClick={() => setSelected(reservation)} aria-label="Visualizar reserva"><Eye className="h-4 w-4" /></button></UiTooltip>
                      <UiTooltip content={reservation.status === 'Pendente' ? 'Registrar pagamento' : 'Pagamento indisponível neste status'}><button className="ghost-button rounded-lg p-2" onClick={() => setPaying(reservation)} aria-label="Registrar pagamento" disabled={reservation.status !== 'Pendente'}><CreditCard className="h-4 w-4" /></button></UiTooltip>
                      <UiTooltip content="Cancelar"><button className="ghost-button rounded-lg p-2" onClick={() => requestCancel(reservation)} aria-label="Cancelar reserva" disabled={['Cancelada', 'Concluída'].includes(reservation.status)}><XCircle className="h-4 w-4" /></button></UiTooltip>
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
            <div className="flex items-center gap-3"><span className="text-muted">{filtered.length} reservas encontradas</span><label className="flex items-center gap-2 text-xs font-semibold text-muted">Por página<select className="form-control min-w-14 py-1.5 text-xs" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>{[8, 16, 24].map((value) => <option key={value}>{value}</option>)}</select></label></div>
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
  const { state, refundPayment } = useAppData();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'Todos'>('Todos');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [refunding, setRefunding] = useState<Payment | null>(null);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const [toastTone, setToastTone] = useState<'success' | 'danger'>('success');
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 8;
  const filtered = state.payments.filter((payment) => `${payment.reservationCode} ${payment.method} ${payment.transactionCode}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'Todos' || payment.status === statusFilter));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);
  const approved = state.payments.filter((payment) => payment.status === 'Aprovado');
  const revenue = approved.reduce((sum, payment) => sum + payment.amount, 0);
  const averageTicket = approved.length ? revenue / approved.length : 0;
  useEffect(() => {
    const paymentId = searchParams.get('pagamento');
    if (!paymentId) return;
    const payment = state.payments.find((item) => item.id === paymentId);
    if (payment) setSelected(payment);
    const next = new URLSearchParams(searchParams);
    next.delete('pagamento');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, state.payments]);
  const confirmRefund = async () => {
    if (!refunding || !user) return;
    try {
      await refundPayment(refunding.id, user);
      setToastTone('success');
      setToast(`Pagamento ${refunding.transactionCode} estornado com sucesso.`);
    } catch (reason) {
      setToastTone('danger');
      setToast(reason instanceof Error ? reason.message : 'Não foi possível estornar o pagamento.');
    } finally {
      setRefunding(null);
    }
  };
  return (
    <>
      <PageHeader title="Pagamentos" subtitle="Controle de PIX, cartões, comprovantes e estornos demonstrativos com trilha de auditoria." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="Receita aprovada" value={currency(revenue)} hint="Pagamentos demonstrativos" icon={Banknote} tone="neon" />
        <StatCard title="Ticket médio" value={currency(averageTicket)} hint="Média dos aprovados" icon={TrendingUp} tone="cyan" />
        {(['Aprovado', 'Pendente', 'Recusado', 'Cancelado'] as const).map((status) => <StatCard key={status} title={status} value={state.payments.filter((payment) => payment.status === status).length} icon={CreditCard} tone={status === 'Aprovado' ? 'neon' : status === 'Pendente' ? 'amber' : 'danger'} />)}
      </div>
      <div className="my-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <IconField label="Buscar pagamentos" leadingIcon={<Search className="h-4 w-4" />} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Reserva, método ou transação" />
        <label className="grid gap-2 text-sm font-semibold">Status<select className="form-control min-w-44" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as PaymentStatus | 'Todos'); setPage(1); }}><option>Todos</option><option>Pendente</option><option>Aprovado</option><option>Recusado</option><option>Cancelado</option></select></label>
      </div>
      <div className="grid gap-3">
        {visible.map((payment) => (
          <div key={payment.id} className="glass-panel card-hover flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <div>
              <p className="font-black">{payment.reservationCode}</p>
              <p className="text-sm text-muted">{payment.method} · {payment.transactionCode}</p>
            </div>
            <div className="text-right">
              <p className="font-black">{currency(payment.amount)}</p>
              <StatusBadge status={payment.status} compact />
              <div className="mt-2 flex flex-wrap justify-end gap-2"><button className="ghost-button min-h-10 rounded-lg px-3 py-2 text-xs font-bold text-neon" onClick={() => setSelected(payment)}>Ver detalhes</button>{payment.status === 'Aprovado' && <button className="ghost-button inline-flex min-h-10 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-[var(--danger)]" onClick={() => setRefunding(payment)}><RefreshCw className="h-3.5 w-3.5" />Estornar</button>}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState title="Nenhum pagamento encontrado" description="A busca não retornou transações para os filtros atuais." />}
        {filtered.length > pageSize && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm"><span className="text-muted">Página {Math.min(page, totalPages)} de {totalPages}</span><div className="flex gap-2"><button className="ghost-button min-h-10 rounded-lg px-3 py-2 font-bold" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button><button className="ghost-button min-h-10 rounded-lg px-3 py-2 font-bold" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Próxima</button></div></div>}
      </div>
      <Modal title="Detalhes do pagamento" open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="max-w-lg">
        {selected && <div className="grid gap-3"><div className="soft-panel rounded-lg p-4"><p className="text-xs text-muted">Transação</p><p className="break-all text-xl font-black">{selected.transactionCode}</p></div>{[['Reserva', selected.reservationCode], ['Método', selected.method], ['Valor', currency(selected.amount)], ['Pago em', selected.paidAt ? new Date(selected.paidAt).toLocaleString('pt-BR') : 'Aguardando confirmação'], ...(selected.refundedAt ? [['Estornado em', new Date(selected.refundedAt).toLocaleString('pt-BR')]] : [])].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm"><span className="text-muted">{label}</span><strong className="text-right">{value}</strong></div>)}<div className="flex items-center justify-between rounded-lg border border-line p-3"><span className="text-sm text-muted">Status</span><StatusBadge status={selected.status} /></div><p className="rounded-lg border border-cyan/25 bg-cyan/10 p-3 text-xs text-cyan">Comprovante demonstrativo: esta transação não representa movimentação financeira real.</p>{selected.status === 'Aprovado' && <button className="ghost-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-bold text-[var(--danger)]" onClick={() => { setRefunding(selected); setSelected(null); }}><RefreshCw className="h-4 w-4" />Estornar pagamento</button>}</div>}
      </Modal>
      <ConfirmDialog open={Boolean(refunding)} title="Estornar pagamento" description={`Confirme o estorno demonstrativo de ${currency(refunding?.amount ?? 0)} da transação ${refunding?.transactionCode ?? ''}. A reserva vinculada será cancelada se ainda não estiver concluída.`} confirmLabel="Confirmar estorno" onClose={() => setRefunding(null)} onConfirm={confirmRefund} />
      <Toast message={toast} tone={toastTone} onClose={() => setToast('')} />
    </>
  );
}

export function AdminReportsPage() {
  const { state } = useAppData();
  const monthly = useMemo(() => Array.from({ length: 6 }, (_, reverseIndex) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - reverseIndex));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      receita: state.payments.filter((payment) => payment.status === 'Aprovado' && (payment.paidAt ?? '').slice(0, 7) === key).reduce((sum, payment) => sum + payment.amount, 0),
      reservas: state.reservations.filter((reservation) => reservation.status !== 'Cancelada' && reservation.date.slice(0, 7) === key).length
    };
  }), [state.payments, state.reservations]);
  const currentMonth = todayIso().slice(0, 7);
  const occupancyByCourt = state.courts.map((court) => {
    const hours = state.reservations.filter((reservation) => reservation.courtId === court.id && reservation.date.startsWith(currentMonth) && reservation.status !== 'Cancelada').reduce((sum, reservation) => sum + Math.max(0, minutesBetween(reservation.startTime, reservation.endTime)) / 60, 0);
    return { court, percent: Math.min(100, Math.round((hours / (14 * 30)) * 100)), hours };
  });
  const peakHours = Array.from(state.reservations.filter((item) => item.status !== 'Cancelada').reduce((map, item) => map.set(item.startTime, (map.get(item.startTime) ?? 0) + 1), new Map<string, number>())).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([hour]) => hour);
  const activeClients = Array.from(state.reservations.reduce((map, item) => map.set(item.clientName, (map.get(item.clientName) ?? 0) + 1), new Map<string, number>())).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  const reservationsByModality = aggregateReservationsByModality(state.reservations.filter((item) => item.status !== 'Cancelada'));
  const exportFile = (name: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob(['\ufeff', content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };
  const reportHeader = ['Código', 'Cliente', 'Quadra', 'Modalidade', 'Data', 'Início', 'Fim', 'Status', 'Valor'];
  const rows = state.reservations.map((reservation) => [reservation.code, reservation.clientName, reservation.courtName, reservation.modality, reservation.date, reservation.startTime, reservation.endTime, reservation.status, reservation.totalValue.toFixed(2)]);
  const csv = [reportHeader, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
  const excelTable = `<html><meta charset="utf-8"><body><h1>PlaySpace — Relatório de reservas</h1><p>Gerado em ${new Date().toLocaleString('pt-BR')}</p><table border="1">${[reportHeader, ...rows].map((row) => `<tr>${row.map((cell) => `<td>${String(cell)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Receita, ocupação, modalidades, horários de pico e exportações."
        action={
          <div className="flex flex-wrap gap-2 print:hidden">
            <button className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir / PDF</button>
            <button className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => exportFile('playspace-relatorio.xls', excelTable, 'application/vnd.ms-excel')}><FileSpreadsheet className="h-4 w-4" />Excel</button>
            <button className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => exportFile('playspace-relatorio.csv', csv, 'text/csv;charset=utf-8')}><Download className="h-4 w-4" />CSV</button>
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Receita por mês" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid stroke="var(--line)" />
                <XAxis dataKey="month" stroke="var(--muted)" />
                <YAxis yAxisId="reservas" stroke="var(--info)" allowDecimals={false} />
                <YAxis yAxisId="receita" orientation="right" stroke="var(--primary)" tickFormatter={(value) => `R$ ${value}`} />
                <RechartsTooltip contentStyle={chartTooltip} formatter={(value, name) => name === 'receita' ? [currency(Number(value)), 'Receita aprovada'] : [value, 'Reservas']} />
                <Legend formatter={(value) => value === 'receita' ? 'Receita aprovada' : 'Reservas'} />
                <Line yAxisId="receita" dataKey="receita" stroke="var(--primary)" strokeWidth={3} />
                <Line yAxisId="reservas" dataKey="reservas" stroke="var(--info)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <SectionTitle title="Ocupação por quadra" />
          <div className="grid gap-3">
            {occupancyByCourt.map(({ court, percent, hours }) => {
              return (
                <div key={court.id}>
                  <div className="mb-1 flex justify-between text-sm"><span>{court.name}</span><span>{percent}% · {hours.toFixed(1)}h</span></div>
                  <div className="h-2 rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-neon transition-all" style={{ width: `${percent}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Horários de pico', peakHours.length ? peakHours.join(', ') : 'Sem dados no período'],
          ['Clientes mais ativos', activeClients.length ? activeClients.join(', ') : 'Sem dados no período'],
          ['Reservas por modalidade', reservationsByModality.length ? reservationsByModality.map((item) => `${item.name} (${item.reservas})`).join(', ') : 'Sem dados no período'],
          ['Cancelamentos', String(state.reservations.filter((item) => item.status === 'Cancelada').length)]
        ].map(([title, value]) => <div key={title} className="soft-panel card-hover rounded-lg p-5"><p className="text-sm text-muted">{title}</p><strong className="mt-2 block text-xl">{value}</strong></div>)}
      </div>
    </>
  );
}

export function AdminUsersPage() {
  const { state, saveUser, toggleUserActive } = useAppData();
  const activeModalities = state.modalityCatalog.filter((item) => item.active).map((item) => item.name);
  const defaultModality = activeModalities[0] ?? ('' as Modality);
  const [editing, setEditing] = useState<User | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'Todos'>('Todos');
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Ativos' | 'Inativos'>('Todos');
  const [toast, setToast] = useState('');
  const [toastTone, setToastTone] = useState<'success' | 'danger'>('success');
  const blank: User = {
    id: '',
    name: '',
    email: '',
    role: 'CLIENTE',
    active: true,
    profile: { photo: 'NV', bio: '', city: 'São Paulo', memberSince: todayIso(), favoriteModality: defaultModality, sports: defaultModality ? [defaultModality] : [], level: 'Iniciante', reservationsDone: 0, matchesPlayed: 0, hoursOnCourt: 0, attendanceRate: 100, achievementsUnlocked: 0 }
  };
  const filtered = state.users.filter((item) => {
    const matchesQuery = `${item.name} ${item.email} ${item.role} ${item.profile.city}`.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === 'Todos' || item.role === roleFilter;
    const matchesActive = activeFilter === 'Todos' || (activeFilter === 'Ativos' ? item.active : !item.active);
    return matchesQuery && matchesRole && matchesActive;
  });

  return (
    <>
      <PageHeader title="Usuários" subtitle="Listar, criar, editar, ativar/inativar e definir perfis." action={<button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setEditing(blank)}><Plus className="h-4 w-4" />Novo usuário</button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
        <IconField label="Buscar usuários" leadingIcon={<Search className="h-4 w-4" />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, e-mail, perfil ou cidade" />
        <label className="grid gap-2 text-sm font-semibold">Perfil<select className="form-control min-w-36" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as Role | 'Todos')}><option>Todos</option><option>ADMIN</option><option>CLIENTE</option></select></label>
        <label className="grid gap-2 text-sm font-semibold">Status<select className="form-control min-w-36" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}><option>Todos</option><option>Ativos</option><option>Inativos</option></select></label>
      </div>
      <div className="grid gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="glass-panel card-hover flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Avatar name={item.name} src={item.profile.photo} size={44} />
              <div>
                <p className="font-black">{item.name}</p>
                <p className="text-sm text-muted">{item.email} · {item.role}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.active ? 'Ativo' : 'Inativo'} compact />
              <UiTooltip content="Ver detalhes"><button className="ghost-button rounded-lg p-2" onClick={() => setViewing(item)} aria-label={`Ver detalhes de ${item.name}`}><Eye className="h-4 w-4" /></button></UiTooltip>
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={async () => { try { await toggleUserActive(item.id); setToastTone('success'); setToast(`Usuário ${item.active ? 'inativado' : 'ativado'} com sucesso.`); } catch (error) { setToastTone('danger'); setToast(error instanceof Error ? error.message : 'Não foi possível alterar o usuário.'); } }}>{item.active ? 'Inativar' : 'Ativar'}</button>
              <UiTooltip content="Editar usuário"><button className="ghost-button rounded-lg p-2" onClick={() => setEditing(item)} aria-label="Editar usuário"><Edit3 className="h-4 w-4" /></button></UiTooltip>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState title="Nenhum usuário encontrado" description="Ajuste sua busca ou crie um novo usuário demo." actionLabel="Novo usuário" onAction={() => setEditing(blank)} />}
      <UserDetailsModal user={viewing} state={state} onClose={() => setViewing(null)} />
      <UserModal key={editing?.id || (editing ? 'new' : 'closed')} user={editing} modalityOptions={activeModalities} onClose={() => setEditing(null)} onSave={async (saved) => { await saveUser(saved); setEditing(null); setToastTone('success'); setToast('Usuário salvo com sucesso.'); }} />
      <Toast message={toast} tone={toastTone} onClose={() => setToast('')} />
    </>
  );
}

function UserDetailsModal({ user, state, onClose }: { user: User | null; state: ReturnType<typeof useAppData>['state']; onClose: () => void }) {
  if (!user) return null;
  const reservations = state.reservations.filter((item) => item.clientId === user.id);
  const reservationIds = new Set(reservations.map((item) => item.id));
  const payments = state.payments.filter((item) => reservationIds.has(item.reservationId));
  const enrollments = state.championshipEnrollments.filter((item) => item.playerId === user.id);
  const paidTotal = payments.filter((item) => item.status === 'Aprovado').reduce((sum, item) => sum + item.amount, 0);

  return (
    <Modal title="Detalhes do usuário" open={Boolean(user)} onClose={onClose} maxWidth="max-w-3xl">
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-[var(--surface-2)] p-4">
          <Avatar name={user.name} src={user.profile.photo} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-black">{user.name}</h3><StatusBadge status={user.active ? 'Ativo' : 'Inativo'} compact /></div>
            <p className="truncate text-sm text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-muted">{user.role === 'ADMIN' ? 'Administrador' : 'Cliente/Jogador'} · {user.profile.city || 'Cidade não informada'}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Reservas', reservations.length],
            ['Pagamentos', payments.length],
            ['Total aprovado', currency(paidTotal)],
            ['Campeonatos', enrollments.length]
          ].map(([label, value]) => <div key={label} className="rounded-lg border border-line p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><strong className="mt-1 block break-words text-lg">{value}</strong></div>)}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Perfil esportivo</p><p className="mt-2 font-bold">{user.profile.favoriteModality} · {user.profile.level}</p><p className="mt-1 text-sm text-muted">{user.profile.sports.join(', ') || 'Nenhuma modalidade cadastrada'}</p></div>
          <div className="rounded-lg border border-line p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Contato e disponibilidade</p><p className="mt-2 font-bold">{user.profile.phone || 'Telefone não informado'}</p><p className="mt-1 text-sm text-muted">{user.profile.availability || 'Disponibilidade não informada'}</p></div>
        </div>

        <section>
          <SectionTitle title="Reservas recentes" />
          <div className="grid gap-2">
            {reservations.slice(0, 5).map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm"><div><strong>{item.code}</strong><p className="text-muted">{item.courtName} · {new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR')} · {item.startTime}</p></div><StatusBadge status={item.status} compact /></div>)}
            {reservations.length === 0 && <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Este usuário ainda não possui reservas.</p>}
          </div>
        </section>

        <section>
          <SectionTitle title="Pagamentos" />
          <div className="grid gap-2">
            {payments.slice(0, 5).map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm"><div><strong>{currency(item.amount)}</strong><p className="text-muted">{item.reservationCode} · {item.method}</p></div><StatusBadge status={item.status} compact /></div>)}
            {payments.length === 0 && <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Nenhum pagamento vinculado a este usuário.</p>}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function UserModal({ user, modalityOptions, onClose, onSave }: { user: User | null; modalityOptions: Modality[]; onClose: () => void; onSave: (user: User) => void | Promise<void> }) {
  const [draft, setDraft] = useState(user);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!user || !draft) return null;
  const favoriteModalityOptions = modalityOptions.includes(draft.profile.favoriteModality) ? modalityOptions : [draft.profile.favoriteModality, ...modalityOptions];
  const update = (key: keyof User, value: string | boolean) => setDraft((current) => current ? { ...current, [key]: value } : current);
  return (
    <Modal title={user.id ? 'Editar usuário' : 'Novo usuário'} open={Boolean(user)} onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); setError(''); if (!user.id && !password) { setError('Informe uma senha provisória.'); return; } if (password !== confirmPassword) { setError('A confirmação de senha não confere.'); return; } if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/.test(password)) { setError('Use ao menos 8 caracteres, maiúscula, minúscula, número e símbolo.'); return; } setSaving(true); try { await onSave({ ...draft, temporaryPassword: password || undefined }); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o usuário.'); } finally { setSaving(false); } }}>
        <div className="flex items-center gap-3 rounded-lg border border-line p-3 md:col-span-2"><Avatar name={draft.name || 'Novo usuário'} src={draft.profile.photo} size={54} /><div><p className="font-bold">Prévia do avatar</p><p className="text-xs text-muted">Imagem configurada ou iniciais como fallback.</p></div></div>
        <label className="grid gap-2 text-sm font-semibold">Nome<input className="form-control" value={draft.name} onChange={(event) => update('name', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">E-mail<input className="form-control" type="email" value={draft.email} onChange={(event) => update('email', event.target.value)} required /></label>
        <label className="grid gap-2 text-sm font-semibold">Perfil<select className="form-control" value={draft.role} onChange={(event) => update('role', event.target.value as Role)}><option>ADMIN</option><option>CLIENTE</option></select></label>
        <label className="grid gap-2 text-sm font-semibold">Cidade<input className="form-control" value={draft.profile.city} onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, city: event.target.value } } : current)} /></label>
        <label className="grid gap-2 text-sm font-semibold">{user.id ? 'Nova senha (opcional)' : 'Senha provisória'}<input className="form-control" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required={!user.id} /></label>
        <label className="grid gap-2 text-sm font-semibold">Confirmar senha<input className="form-control" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required={Boolean(password) || !user.id} /></label>
        <label className="grid gap-2 text-sm font-semibold">Modalidade favorita<select className="form-control" value={draft.profile.favoriteModality} onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, favoriteModality: event.target.value as Modality } } : current)} required>{favoriteModalityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Nível esportivo<select className="form-control" value={draft.profile.level} onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, level: event.target.value as User['profile']['level'] } } : current)}>{['Iniciante', 'Intermediário', 'Avançado', 'Competitivo'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">URL do avatar (opcional)<input className="form-control" type="url" value={draft.profile.photo.startsWith('http') ? draft.profile.photo : ''} placeholder="https://..." onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, photo: event.target.value } } : current)} /></label>
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">Bio<textarea className="form-control min-h-24" value={draft.profile.bio} onChange={(event) => setDraft((current) => current ? { ...current, profile: { ...current.profile, bio: event.target.value } } : current)} /></label>
        <label className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold md:col-span-2"><input type="checkbox" checked={draft.active} onChange={(event) => update('active', event.target.checked)} />Usuário ativo</label>
        {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)] md:col-span-2" role="alert">{error}</p>}
        <button className="neon-button rounded-lg px-5 py-3 font-black disabled:opacity-60 md:col-span-2" disabled={saving}>{saving ? 'Salvando usuário...' : 'Salvar usuário'}</button>
      </form>
    </Modal>
  );
}

export function AdminSettingsPage() {
  const { state, saveSettings } = useAppData();
  const activeModalities = state.modalityCatalog.filter((item) => item.active).map((item) => item.name);
  const [draft, setDraft] = useState(() => structuredClone(state.settings));
  const [saved, setSaved] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.settings);
  return (
    <>
      <PageHeader title="Configurações" subtitle="Parâmetros carregados da API em modo leitura; ajustes locais valem apenas nesta sessão." />
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Seções de configuração">{['Empresa', 'Funcionamento', 'Reservas', 'Preços', 'Pagamentos', 'Notificações', 'Aparência', 'Segurança'].map((item) => <a key={item} className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted hover:border-neon/35 hover:text-[var(--text)]" href={['Empresa', 'Funcionamento', 'Reservas', 'Preços'].includes(item) ? `#config-${item.toLowerCase()}` : '#config-futuro'}>{item}</a>)}</div>
      <form className="grid gap-4" onSubmit={(event: FormEvent) => { event.preventDefault(); saveSettings(draft); setSaved('Configurações aplicadas localmente nesta sessão. A API ainda não oferece persistência de alterações.'); }}>
        <section id="config-empresa" className="glass-panel scroll-mt-24 rounded-lg p-5">
          <SectionTitle title="Empresa" action={<Settings className="h-5 w-5 text-neon" />} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Nome da empresa<input className="form-control" value={draft.company} onChange={(event) => { setDraft((current) => ({ ...current, company: event.target.value })); setSaved(''); }} required aria-label="Nome da empresa" /></label>
            <label id="config-funcionamento" className="grid scroll-mt-24 gap-2 text-sm font-semibold">Horário geral de funcionamento<input className="form-control" value={draft.hours} onChange={(event) => { setDraft((current) => ({ ...current, hours: event.target.value })); setSaved(''); }} aria-describedby="hours-help" aria-label="Horário geral de funcionamento" /><span id="hours-help" className="text-xs font-normal text-muted">Formato sugerido: 08:00 - 22:00.</span></label>
          </div>
        </section>
        <section id="config-reservas" className="glass-panel scroll-mt-24 rounded-lg p-5">
          <SectionTitle title="Regras de reserva" action={<SlidersHorizontal className="h-5 w-5 text-cyan" />} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Cancelamento permitido até (horas antes)<input className="form-control" type="number" min={1} max={168} value={draft.cancelationRuleHours} onChange={(event) => { setDraft((current) => ({ ...current, cancelationRuleHours: Number(event.target.value) })); setSaved(''); }} aria-label="Horas mínimas para cancelamento" /></label>
            <label className="grid gap-2 text-sm font-semibold">Duração mínima da reserva (minutos)<input className="form-control" type="number" min={30} step={30} value={draft.minimumReservationMinutes} onChange={(event) => { setDraft((current) => ({ ...current, minimumReservationMinutes: Number(event.target.value) })); setSaved(''); }} aria-label="Duração mínima da reserva em minutos" /></label>
          </div>
        </section>
        <section id="config-preços" className="glass-panel scroll-mt-24 rounded-lg p-5">
          <SectionTitle title="Modalidades e preços" />
          <div className="mb-4 flex flex-wrap gap-2">{activeModalities.map((item) => <span key={item} className="rounded-full border border-line px-3 py-1 text-sm">{item}</span>)}</div>
          <div className="grid gap-3 md:grid-cols-3">
            {activeModalities.map((item) => (
              <label key={item} className="grid gap-2 text-sm font-semibold">
                {item}
                <input className="form-control" type="number" min={0} step={5} value={draft.defaultPrices[item] ?? state.modalityCatalog.find((entry) => entry.name === item)?.defaultPrice ?? 0} onChange={(event) => { setDraft((current) => ({ ...current, defaultPrices: { ...current.defaultPrices, [item]: Number(event.target.value) } })); setSaved(''); }} aria-label={`Preço padrão de ${item}`} />
              </label>
            ))}
          </div>
        </section>
        <section id="config-futuro" className="soft-panel scroll-mt-24 rounded-lg p-4 text-sm text-muted"><strong className="text-[var(--text)]">Pagamentos, notificações, aparência e segurança</strong><p className="mt-1">Estas áreas permanecem claramente identificadas como próximas etapas e não exibem controles decorativos.</p></section>
        {saved && <p className="rounded-lg border border-neon/30 bg-neon/10 p-3 text-sm text-neon" role="status">{saved}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-[var(--surface-elevated)] p-3 shadow-panel lg:sticky lg:bottom-4 lg:z-10"><span className="text-sm text-muted">{dirty ? 'Há alterações não salvas.' : 'Todas as alterações foram salvas.'}</span><div className="flex flex-wrap gap-2"><button className="ghost-button rounded-lg px-4 py-2 text-sm font-bold" type="button" disabled={!dirty} onClick={() => { setDraft(structuredClone(state.settings)); setSaved('Configurações restauradas para a última versão salva.'); }}>Restaurar</button><button className="neon-button rounded-lg px-5 py-2 text-sm font-black" disabled={!dirty}>Salvar configurações</button></div></div>
      </form>
    </>
  );
}

export function AdminCommunityPage() {
  const { state, likePost, commentPost } = useAppData();
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
                <div className="flex items-start gap-3"><Avatar name={post.authorName} src={post.avatarUrl ?? state.users.find((item) => item.id === post.authorId)?.profile.photo} size={42} /><p><strong>{post.authorName}</strong> {post.content}</p></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => void likePost(post.id)}>Curtir · {post.likes}</button>
                  <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => { commentPost(post.id); setToast('Comentário demonstrativo adicionado à publicação.'); }}>Comentar · {post.comments}</button>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [health, setHealth] = useState<Record<string, unknown>>({ api: 'DEMO', database: 'DEMO', realtime: 'SIMULATED', scheduler: 'DEMO' });
  const refresh = async () => {
    const token = tokenFromStorage();
    setLoading(true);
    setError('');
    try {
      if (!token || token.startsWith('demo-')) throw new Error('API não conectada nesta sessão.');
      setHealth(await fetchSystemStatus(token));
      setRefreshed(new Date());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível consultar o status.');
      setHealth({ api: 'DEMO', database: 'DEMO', realtime: 'SIMULATED', scheduler: 'DEMO' });
      setRefreshed(new Date());
    } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);
  const statusLabel = (value: unknown) => value === 'UP' ? 'Operacional' : value === 'SIMULATED' || value === 'DEMO' ? 'Demonstração' : value === 'DOWN' ? 'Indisponível' : 'Não configurado';
  return (
    <>
      <PageHeader title="Status do sistema" subtitle="Painel técnico sem exposição de hosts, credenciais ou dados sensíveis." action={<button className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold disabled:opacity-60" onClick={refresh} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{loading ? 'Verificando...' : 'Atualizar'}</button>} />
      {error && <p className="mb-4 rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber" role="status">{error} Exibindo integrações como demonstração.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['API', statusLabel(health.api), ShieldCheck],
          ['Banco de dados', statusLabel(health.database), CheckCircle2],
          ['Realtime', statusLabel(health.realtime), Activity],
          ['Agendador / fila', statusLabel(health.scheduler), BarChart3],
          ['Frontend', 'Operacional', CheckCircle2],
          ['Armazenamento', 'Não configurado', ShieldCheck],
          ['Backup', 'Não configurado', ShieldCheck],
          ['Auditoria', 'Operacional', BarChart3]
        ].map(([title, status, Icon]) => {
          const StatusIcon = Icon as LucideIcon;
          return (
            <div key={String(title)} className="glass-panel card-hover rounded-lg p-5">
              <StatusIcon className="h-6 w-6 text-neon" />
              <p className="mt-4 text-sm text-muted">{String(title)}</p>
              <span className="mt-2 inline-flex"><StatusBadge status={String(status)} compact /></span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid gap-3 rounded-lg border border-line p-4 text-sm sm:grid-cols-3"><p><span className="block text-xs text-muted">Versão</span><strong>1.0.0</strong></p><p><span className="block text-xs text-muted">Ambiente</span><strong>{import.meta.env.MODE}</strong></p><p><span className="block text-xs text-muted">Última verificação</span><strong>{refreshed.toLocaleString('pt-BR')}</strong></p></div>
    </>
  );
}
