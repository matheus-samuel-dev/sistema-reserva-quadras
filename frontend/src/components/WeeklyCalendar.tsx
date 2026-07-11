import { ChevronLeft, ChevronRight, Clock3, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import type { Modality, Reservation, ReservationStatus } from '../lib/types';

const dayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const hourNumbers = Array.from({ length: 15 }, (_, index) => index + 8);
const hours = hourNumbers.map((hour) => `${String(hour).padStart(2, '0')}:00`);
const rowHeight = 84;
const headerHeight = 58;

const statusClasses: Record<ReservationStatus, string> = {
  Pendente: 'border-amber/40 bg-amber/15 hover:border-amber/70',
  Confirmada: 'border-neon/40 bg-neon/15 hover:border-neon/70',
  'Em andamento': 'border-cyan/40 bg-cyan/15 hover:border-cyan/70',
  Concluída: 'border-slate-300/25 bg-slate-300/10 hover:border-slate-300/45',
  Cancelada: 'border-rose-400/40 bg-rose-400/12 hover:border-rose-400/70'
};

const mondayOf = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatIso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDate = (a: Date, b: Date) => formatIso(a) === formatIso(b);
const minutesFromTime = (time: string) => {
  const [hoursPart, minutesPart] = time.split(':').map(Number);
  return hoursPart * 60 + minutesPart;
};

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
  const [now, setNow] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return date;
      }),
    [weekStart]
  );

  const visibleReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        const insideWeek = days.some((day) => formatIso(day) === reservation.date);
        const courtOk = !courtFilter || courtFilter === 'Todas' || reservation.courtId === courtFilter;
        const modalityOk = !modalityFilter || modalityFilter === 'Todas' || reservation.modality === modalityFilter;
        return insideWeek && courtOk && modalityOk;
      }),
    [courtFilter, days, modalityFilter, reservations]
  );

  const currentLine = useMemo(() => {
    const dayIndex = days.findIndex((day) => isSameDate(day, now));
    const decimalHour = now.getHours() + now.getMinutes() / 60;
    if (dayIndex < 0 || decimalHour < 8 || decimalHour > 22) return null;
    return {
      top: headerHeight + (decimalHour - 8) * rowHeight,
      label: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  }, [days, now]);

  const goToday = () => {
    setWeekStart(mondayOf(new Date()));
    setSelectedSlot('');
  };

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neon/25 bg-neon/10 px-3 py-1 text-xs font-bold text-neon">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Calendário semanal
          </div>
          <h2 className="text-xl font-black">Agenda de Quadras</h2>
          <p className="text-sm text-muted">
            {days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="ghost-button rounded-lg px-3 py-2 text-sm font-bold" onClick={goToday}>Hoje</button>
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

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {(['Pendente', 'Confirmada', 'Em andamento', 'Concluída', 'Cancelada'] as ReservationStatus[]).map((status) => (
          <StatusBadge key={status} status={status} compact />
        ))}
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <div className="relative min-w-[980px] overflow-hidden rounded-lg border border-line">
          {currentLine && (
            <div className="pointer-events-none absolute left-[72px] right-0 z-20 border-t border-neon/80" style={{ top: currentLine.top }}>
              <span className="-mt-3 ml-2 inline-flex rounded-full border border-neon/40 bg-[#07110c] px-2 py-0.5 text-[11px] font-black text-neon shadow-glow">
                Agora {currentLine.label}
              </span>
            </div>
          )}
          <div className="calendar-grid">
            <div className="border-b border-line bg-white/[0.04] p-3 text-xs font-bold uppercase text-muted" style={{ minHeight: headerHeight }}>Hora</div>
            {days.map((day, index) => {
              const today = isSameDate(day, now);
              return (
                <div key={formatIso(day)} className={`border-b border-l border-line p-3 text-center ${today ? 'bg-neon/10' : 'bg-white/[0.04]'}`} style={{ minHeight: headerHeight }}>
                  <p className={`text-xs font-bold ${today ? 'text-neon' : 'text-muted'}`}>{dayLabels[index]}</p>
                  <p className="text-sm font-black">{day.getDate()}</p>
                </div>
              );
            })}
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="calendar-slot border-b border-line bg-white/[0.02] p-2 text-xs font-semibold text-muted">{hour}</div>
                {days.map((day) => {
                  const isoDay = formatIso(day);
                  const slotReservations = visibleReservations.filter((reservation) => reservation.date === isoDay && reservation.startTime === hour);
                  const key = `${isoDay}-${hour}`;
                  const selected = selectedSlot === key;
                  return (
                    <div key={key} className={`calendar-slot border-b border-l border-line p-1.5 transition ${selected ? 'bg-neon/10' : 'hover:bg-white/[0.035]'}`}>
                      {slotReservations.map((reservation) => {
                        const duration = Math.max(1, (minutesFromTime(reservation.endTime) - minutesFromTime(reservation.startTime)) / 60);
                        return (
                          <button
                            key={reservation.id}
                            className={`mb-1 w-full rounded-md border p-2 text-left text-xs transition hover:-translate-y-0.5 ${statusClasses[reservation.status]}`}
                            onClick={() => onReservationClick(reservation)}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <strong className="block text-[var(--text)]">{reservation.startTime} - {reservation.endTime}</strong>
                              <span className="text-[10px] font-bold text-muted">{duration}h</span>
                            </span>
                            <span className="mt-1 block truncate font-semibold">{reservation.courtName}</span>
                            <span className="block truncate text-muted">{reservation.modality}</span>
                            <span className="mt-2 block"><StatusBadge status={reservation.status} compact /></span>
                          </button>
                        );
                      })}
                      {slotReservations.length === 0 && (
                        <button
                          className={`grid h-full min-h-[4.5rem] w-full place-items-center rounded-md border border-dashed text-xs transition ${selected ? 'border-neon/50 bg-neon/10 text-neon' : 'border-transparent text-transparent hover:border-line hover:text-muted'}`}
                          onClick={() => setSelectedSlot(selected ? '' : key)}
                          aria-label={`Selecionar horário livre ${hour} em ${isoDay}`}
                        >
                          {selected ? (
                            <span className="grid gap-2 text-center">
                              <span className="font-bold">Horário livre</span>
                              <span className="neon-button inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 font-black" onClick={(event) => { event.stopPropagation(); onNewReservation(); }}>
                                <Plus className="h-3.5 w-3.5" />
                                Reservar
                              </span>
                            </span>
                          ) : (
                            <span>livre</span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
