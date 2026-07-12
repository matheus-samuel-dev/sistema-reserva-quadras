import { AlertCircle, CalendarClock, CheckCircle2, CreditCard, LoaderCircle, Users, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import type { PaymentMethod, ReservationFormInput, User } from '../lib/types';

const todayIso = () => new Date().toISOString().slice(0, 10);
const activeStatuses = ['Pendente', 'Confirmada', 'Em andamento'];
const paymentMethods: PaymentMethod[] = ['PIX', 'Cartão de Crédito', 'Cartão de Débito'];

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const minutesBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

export function ReservationForm({ actor, onCreated, initialValues }: { actor: User; onCreated: (reservationId: string) => void; initialValues?: Partial<ReservationFormInput> }) {
  const { state, dataSource, createReservation, ensureAvailabilityRange } = useAppData();
  const availableCourts = state.courts.filter((court) => court.status === 'Disponível');
  const [form, setForm] = useState<ReservationFormInput>({
    clientId: actor.role === 'ADMIN' ? state.users.find((user) => user.role === 'CLIENTE')?.id : actor.id,
    courtId: availableCourts[0]?.id ?? '',
    date: todayIso(),
    startTime: '18:00',
    endTime: '19:00',
    players: 4,
    paymentMethod: 'PIX',
    notes: '',
    ...initialValues
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availabilityState, setAvailabilityState] = useState<'loading' | 'ready' | 'error'>(dataSource === 'api' ? 'loading' : 'ready');
  const [availabilityError, setAvailabilityError] = useState('');
  const [verifiedDate, setVerifiedDate] = useState(dataSource === 'api' ? '' : form.date);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const availabilityRequest = useRef(0);

  useEffect(() => {
    const requestId = ++availabilityRequest.current;

    if (dataSource !== 'api') {
      setAvailabilityState('ready');
      setAvailabilityError('');
      setVerifiedDate(form.date);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      setAvailabilityState('error');
      setAvailabilityError('Informe uma data válida para consultar a disponibilidade.');
      setVerifiedDate('');
      return;
    }

    setAvailabilityState('loading');
    setAvailabilityError('');
    setVerifiedDate('');

    ensureAvailabilityRange(form.date, form.date)
      .then(() => {
        if (requestId !== availabilityRequest.current) return;
        setAvailabilityState('ready');
        setVerifiedDate(form.date);
      })
      .catch((reason) => {
        if (requestId !== availabilityRequest.current) return;
        setAvailabilityState('error');
        setAvailabilityError(reason instanceof Error ? reason.message : 'Não foi possível verificar a disponibilidade deste dia.');
        setVerifiedDate('');
      });

    return () => {
      if (availabilityRequest.current === requestId) availabilityRequest.current += 1;
    };
  }, [availabilityRetry, dataSource, ensureAvailabilityRange, form.date]);

  const selectedCourt = state.courts.find((court) => court.id === form.courtId);
  const durationMinutes = minutesBetween(form.startTime, form.endTime);
  const totalValue = selectedCourt && durationMinutes > 0 ? (selectedCourt.pricePerHour * durationMinutes) / 60 : 0;

  const conflict = useMemo(
    () =>
      state.reservations.find((reservation) => {
        if (reservation.courtId !== form.courtId || reservation.date !== form.date || !activeStatuses.includes(reservation.status)) return false;
        return form.startTime < reservation.endTime && form.endTime > reservation.startTime;
      }),
    [form.courtId, form.date, form.endTime, form.startTime, state.reservations]
  );

  const validation = useMemo(() => {
    const messages: string[] = [];
    if (!form.courtId) messages.push('Selecione uma quadra disponível.');
    if (!form.clientId) messages.push('Selecione um cliente para a reserva.');
    if (durationMinutes <= 0) messages.push('O horário final deve ser maior que o inicial.');
    if (form.startTime < '08:00' || form.endTime > '22:00') messages.push('Reservas permitidas apenas entre 08:00 e 22:00.');
    if (new Date(`${form.date}T${form.startTime}:00`).getTime() < Date.now()) messages.push('Escolha um horário futuro.');
    if (selectedCourt && form.players > selectedCourt.playerCapacity) messages.push(`Capacidade máxima: ${selectedCourt.playerCapacity} jogadores.`);
    if (conflict) messages.push(`Conflito com ${conflict.code} (${conflict.startTime} - ${conflict.endTime}).`);
    return messages;
  }, [conflict, durationMinutes, form.clientId, form.courtId, form.date, form.endTime, form.players, form.startTime, selectedCourt]);

  const availabilityReady = dataSource !== 'api' || (availabilityState === 'ready' && verifiedDate === form.date);

  const update = (key: keyof ReservationFormInput, value: string | number) => {
    setError('');
    if (key === 'date' && dataSource === 'api') {
      setAvailabilityState('loading');
      setAvailabilityError('');
      setVerifiedDate('');
    }
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="grid gap-5"
      aria-busy={dataSource === 'api' && availabilityState === 'loading'}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!availabilityReady) {
          setError(availabilityError || 'Aguarde a verificação da disponibilidade antes de criar a reserva.');
          return;
        }
        if (validation.length > 0) {
          setError(validation[0]);
          return;
        }
        setSubmitting(true);
        try {
          const created = await createReservation(form, actor);
          onCreated(created.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Não foi possível criar a reserva.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {actor.role === 'ADMIN' && (
          <label className="grid gap-2 text-sm font-semibold">
            Cliente
            <select className="form-control" value={form.clientId} onChange={(event) => update('clientId', event.target.value)} aria-label="Cliente da reserva">
              {state.users.filter((user) => user.role === 'CLIENTE').map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </label>
        )}
        <label className="grid gap-2 text-sm font-semibold">
          Quadra
          <select className="form-control" value={form.courtId} onChange={(event) => update('courtId', event.target.value)} aria-invalid={!form.courtId} aria-label="Quadra da reserva">
            {availableCourts.map((court) => <option key={court.id} value={court.id}>{court.name} - {court.modality}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Data
          <input className="form-control" type="date" min={todayIso()} value={form.date} onChange={(event) => update('date', event.target.value)} aria-label="Data da reserva" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Início
          <input className="form-control" type="time" min="08:00" max="22:00" step="3600" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} aria-label="Horário inicial" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Fim
          <input className="form-control" type="time" min="08:00" max="22:00" step="3600" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} aria-label="Horário final" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Jogadores
          <input className="form-control" type="number" min={1} max={selectedCourt?.playerCapacity} value={form.players} onChange={(event) => update('players', Number(event.target.value))} aria-label="Quantidade de jogadores" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {paymentMethods.map((method) => (
          <button
            key={method}
            type="button"
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${form.paymentMethod === method ? 'border-neon bg-neon/10' : 'border-line bg-white/[0.03] hover:border-neon/30'}`}
            onClick={() => update('paymentMethod', method)}
          >
            <CreditCard className={method === 'PIX' ? 'h-5 w-5 text-neon' : 'h-5 w-5 text-cyan'} aria-hidden="true" />
            <span>
              <strong className="block text-sm">{method}</strong>
              <span className="text-xs text-muted">{method === 'PIX' ? 'Aprovação imediata' : 'Confirmação demo'}</span>
            </span>
          </button>
        ))}
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Observações
        <textarea className="form-control min-h-24" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Ex.: reserva para treino, evento ou observação operacional" aria-label="Observações da reserva" />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="app-card p-4">
          <CalendarClock className="h-5 w-5 text-neon" aria-hidden="true" />
          <p className="mt-3 text-xs text-muted">Duração</p>
          <strong className="metric-value">{durationMinutes > 0 ? `${durationMinutes / 60}h` : '-'}</strong>
        </div>
        <div className="app-card p-4">
          <Users className="h-5 w-5 text-cyan" aria-hidden="true" />
          <p className="mt-3 text-xs text-muted">Capacidade</p>
          <strong className="metric-value">{selectedCourt ? `${form.players}/${selectedCourt.playerCapacity}` : '-'}</strong>
        </div>
        <div className="app-card p-4">
          <WalletCards className="h-5 w-5 text-amber" aria-hidden="true" />
          <p className="mt-3 text-xs text-muted">Total · {selectedCourt ? `${currency(selectedCourt.pricePerHour)}/h` : '-'}</p>
          <strong className="metric-value text-neon">{currency(totalValue)}</strong>
        </div>
      </div>

      {dataSource === 'api' && !availabilityReady && availabilityState === 'loading' && (
        <div className="flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 p-3 text-sm text-cyan" role="status" aria-live="polite">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Consultando a disponibilidade desta data…
        </div>
      )}
      {dataSource === 'api' && !availabilityReady && availabilityState === 'error' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber" role="alert">
          <span className="flex min-w-0 items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span><strong>Disponibilidade não verificada.</strong> {availabilityError}</span>
          </span>
          <button className="rounded-md border border-current px-3 py-2 text-xs font-black hover:bg-amber/10" type="button" onClick={() => setAvailabilityRetry((current) => current + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {validation.length === 0 && availabilityReady && (
        <div className="flex items-center gap-2 rounded-lg border border-neon/30 bg-neon/10 p-3 text-sm text-neon">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Horário disponível. A reserva será criada como pendente até o pagamento.
        </div>
      )}
      {(error || validation.length > 0) && (
        <div className="rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber">
          {error || validation[0]}
        </div>
      )}
      <button className="neon-button rounded-lg px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting || validation.length > 0 || !availabilityReady} type="submit">
        {submitting ? 'Criando reserva...' : dataSource === 'api' && availabilityState === 'loading' ? 'Verificando horário...' : 'Criar reserva'}
      </button>
    </form>
  );
}
