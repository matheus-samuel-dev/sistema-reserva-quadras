import { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import type { PaymentMethod, ReservationFormInput, User } from '../lib/types';

const todayIso = () => new Date().toISOString().slice(0, 10);

export function ReservationForm({ actor, onCreated }: { actor: User; onCreated: (reservationId: string) => void }) {
  const { state, createReservation } = useAppData();
  const availableCourts = state.courts.filter((court) => court.status === 'Disponível');
  const [form, setForm] = useState<ReservationFormInput>({
    clientId: actor.role === 'ADMIN' ? state.users.find((user) => user.role === 'CLIENTE')?.id : actor.id,
    courtId: availableCourts[0]?.id ?? '',
    date: todayIso(),
    startTime: '18:00',
    endTime: '19:00',
    players: 4,
    paymentMethod: 'PIX',
    notes: ''
  });
  const [error, setError] = useState('');

  const update = (key: keyof ReservationFormInput, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          const created = createReservation(form, actor);
          onCreated(created.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Não foi possível criar a reserva.');
        }
      }}
    >
      {actor.role === 'ADMIN' && (
        <label className="grid gap-2 text-sm font-semibold">
          Cliente
          <select className="rounded-lg border border-line bg-white/5 p-3" value={form.clientId} onChange={(event) => update('clientId', event.target.value)}>
            {state.users.filter((user) => user.role === 'CLIENTE').map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </label>
      )}
      <label className="grid gap-2 text-sm font-semibold">
        Quadra
        <select className="rounded-lg border border-line bg-white/5 p-3" value={form.courtId} onChange={(event) => update('courtId', event.target.value)}>
          {availableCourts.map((court) => <option key={court.id} value={court.id}>{court.name} - {court.modality}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Data
        <input className="rounded-lg border border-line bg-white/5 p-3" type="date" min={todayIso()} value={form.date} onChange={(event) => update('date', event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Início
        <input className="rounded-lg border border-line bg-white/5 p-3" type="time" min="08:00" max="22:00" step="3600" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Fim
        <input className="rounded-lg border border-line bg-white/5 p-3" type="time" min="08:00" max="22:00" step="3600" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Jogadores
        <input className="rounded-lg border border-line bg-white/5 p-3" type="number" min={1} value={form.players} onChange={(event) => update('players', Number(event.target.value))} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Pagamento
        <select className="rounded-lg border border-line bg-white/5 p-3" value={form.paymentMethod} onChange={(event) => update('paymentMethod', event.target.value as PaymentMethod)}>
          <option>PIX</option>
          <option>Cartão de Crédito</option>
          <option>Cartão de Débito</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold md:col-span-2">
        Observações
        <textarea className="min-h-24 rounded-lg border border-line bg-white/5 p-3" value={form.notes} onChange={(event) => update('notes', event.target.value)} />
      </label>
      {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200 md:col-span-2">{error}</p>}
      <button className="neon-button rounded-lg px-5 py-3 font-black md:col-span-2" type="submit">Criar reserva</button>
    </form>
  );
}
