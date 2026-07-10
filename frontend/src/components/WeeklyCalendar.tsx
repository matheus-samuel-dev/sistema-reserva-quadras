import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import type { Modality, Reservation } from '../lib/types';

const dayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const hours = Array.from({ length: 15 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`);
const colors = ['bg-neon/20 border-neon/40', 'bg-cyan/20 border-cyan/40', 'bg-violet-400/20 border-violet-400/40', 'bg-amber/20 border-amber/40', 'bg-rose-400/20 border-rose-400/40'];

const mondayOf = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatIso = (date: Date) => date.toISOString().slice(0, 10);

export function WeeklyCalendar({
  reservations,
  courtFilter,
  modalityFilter,
  onReservationClick,
  onNewReservation
}: {
  reservations: Reservation[];
  courtFilter?: string;
  modalityFilter?: Modality | 'Todas';
  onReservationClick: (reservation: Reservation) => void;
  onNewReservation: () => void;
}) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [weekStart]);

  const visibleReservations = reservations.filter((reservation) => {
    const insideWeek = days.some((day) => formatIso(day) === reservation.date);
    const courtOk = !courtFilter || courtFilter === 'Todas' || reservation.courtId === courtFilter;
    const modalityOk = !modalityFilter || modalityFilter === 'Todas' || reservation.modality === modalityFilter;
    return insideWeek && courtOk && modalityOk;
  });

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Agenda de Quadras</h2>
          <p className="text-sm text-muted">
            {days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => setWeekStart(mondayOf(new Date()))}>Hoje</button>
          <button className="ghost-button rounded-lg p-2" aria-label="Semana anterior" onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button className="ghost-button rounded-lg p-2" aria-label="Próxima semana" onClick={() => setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold" onClick={onNewReservation}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova reserva
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <div className="calendar-grid min-w-[920px] rounded-lg border border-line">
          <div className="border-b border-line bg-white/[0.03] p-2 text-xs text-muted">Hora</div>
          {days.map((day, index) => (
            <div key={formatIso(day)} className="border-b border-l border-line bg-white/[0.03] p-2 text-center">
              <p className="text-xs font-bold text-muted">{dayLabels[index]}</p>
              <p className="text-sm font-black">{day.getDate()}</p>
            </div>
          ))}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="min-h-20 border-b border-line p-2 text-xs text-muted">{hour}</div>
              {days.map((day, dayIndex) => {
                const slotReservations = visibleReservations.filter((reservation) => reservation.date === formatIso(day) && reservation.startTime === hour);
                return (
                  <div key={`${formatIso(day)}-${hour}`} className="min-h-20 border-b border-l border-line p-1">
                    {slotReservations.map((reservation) => (
                      <button
                        key={reservation.id}
                        className={`mb-1 w-full rounded-md border p-2 text-left text-xs ${colors[(dayIndex + reservation.courtId.length) % colors.length]} hover:brightness-125`}
                        onClick={() => onReservationClick(reservation)}
                      >
                        <strong className="block text-[var(--text)]">{reservation.startTime} - {reservation.endTime}</strong>
                        <span className="block truncate">{reservation.courtName}</span>
                        <span className="block truncate text-muted">{reservation.modality}</span>
                        <span className="mt-1 block"><StatusBadge status={reservation.status} /></span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
