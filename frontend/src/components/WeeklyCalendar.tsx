import { AlertCircle, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { Tooltip } from './Tooltip';
import { getStatusMeta } from '../lib/status';
import type { Modality, Reservation, ReservationFormInput, ReservationStatus } from '../lib/types';

const hourNumbers = Array.from({ length: 15 }, (_, index) => index + 8);
const hours = hourNumbers.map((hour) => `${String(hour).padStart(2, '0')}:00`);
const rowHeight = 84;
const headerHeight = 58;

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
  onNewReservation,
  onVisibleRangeChange
}: {
  reservations: Reservation[];
  courtFilter?: string;
  modalityFilter?: Modality | 'Todas';
  onReservationClick: (reservation: Reservation) => void;
  onNewReservation: (initialValues?: Partial<ReservationFormInput>) => void;
  onVisibleRangeChange?: (start: string, end: string) => Promise<void>;
}) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [dayCursor, setDayCursor] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>(() => window.innerWidth < 640 ? 'day' : 'week');
  const [now, setNow] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availabilityState, setAvailabilityState] = useState<'loading' | 'ready' | 'error'>(onVisibleRangeChange ? 'loading' : 'ready');
  const [availabilityError, setAvailabilityError] = useState('');
  const [verifiedRange, setVerifiedRange] = useState('');
  const availabilityRequest = useRef(0);

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
  const displayDays = viewMode === 'week' ? days : [dayCursor];
  const visibleStart = formatIso(displayDays[0]);
  const visibleEnd = formatIso(displayDays[displayDays.length - 1]);
  const visibleRangeKey = `${visibleStart}:${visibleEnd}`;

  const loadVisibleRange = useCallback(() => {
    const requestId = ++availabilityRequest.current;
    if (!onVisibleRangeChange) {
      setAvailabilityState('ready');
      setAvailabilityError('');
      setVerifiedRange(visibleRangeKey);
      return;
    }

    setAvailabilityState('loading');
    setAvailabilityError('');
    void onVisibleRangeChange(visibleStart, visibleEnd)
      .then(() => {
        if (requestId !== availabilityRequest.current) return;
        setVerifiedRange(visibleRangeKey);
        setAvailabilityState('ready');
      })
      .catch((error) => {
        if (requestId !== availabilityRequest.current) return;
        setVerifiedRange('');
        setAvailabilityError(error instanceof Error ? error.message : 'Não foi possível verificar a disponibilidade deste período.');
        setAvailabilityState('error');
      });
  }, [onVisibleRangeChange, visibleEnd, visibleRangeKey, visibleStart]);

  useEffect(() => {
    loadVisibleRange();
    return () => {
      availabilityRequest.current += 1;
    };
  }, [loadVisibleRange]);

  const availabilityReady = !onVisibleRangeChange || (availabilityState === 'ready' && verifiedRange === visibleRangeKey);

  const visibleReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        const insideWeek = displayDays.some((day) => formatIso(day) === reservation.date);
        const courtOk = !courtFilter || courtFilter === 'Todas' || reservation.courtId === courtFilter;
        const modalityOk = !modalityFilter || modalityFilter === 'Todas' || reservation.modality === modalityFilter;
        return insideWeek && courtOk && modalityOk;
      }),
    [courtFilter, displayDays, modalityFilter, reservations]
  );

  const currentLine = useMemo(() => {
    const dayIndex = displayDays.findIndex((day) => isSameDate(day, now));
    const decimalHour = now.getHours() + now.getMinutes() / 60;
    if (dayIndex < 0 || decimalHour < 8 || decimalHour > 22) return null;
    return {
      top: headerHeight + (decimalHour - 8) * rowHeight,
      label: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  }, [displayDays, now]);

  const goToday = () => {
    setWeekStart(mondayOf(new Date()));
    setDayCursor(new Date());
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
            {viewMode === 'week'
              ? `${days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
              : dayCursor.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-line p-1" aria-label="Visualização da agenda">
            {(['day', 'week'] as const).map((mode) => <button key={mode} className={`min-h-10 rounded-md px-3 py-1.5 text-xs font-bold ${viewMode === mode ? 'bg-neon text-[#07110c]' : 'text-muted'}`} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode}>{mode === 'day' ? 'Dia' : 'Semana'}</button>)}
          </div>
          <button className="ghost-button rounded-lg px-3 py-2 text-sm font-bold" onClick={goToday}>Hoje</button>
          <button className="ghost-button rounded-lg p-2" aria-label={viewMode === 'week' ? 'Semana anterior' : 'Dia anterior'} onClick={() => viewMode === 'week' ? setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)) : setDayCursor((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button className="ghost-button rounded-lg p-2" aria-label={viewMode === 'week' ? 'Próxima semana' : 'Próximo dia'} onClick={() => viewMode === 'week' ? setWeekStart((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7)) : setDayCursor((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button className="neon-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onNewReservation()} disabled={!availabilityReady}>
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

      {onVisibleRangeChange && !availabilityReady && availabilityState !== 'error' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm text-cyan" role="status" aria-live="polite">
          <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          Consultando a disponibilidade real de {new Date(`${visibleStart}T12:00:00`).toLocaleDateString('pt-BR')} a {new Date(`${visibleEnd}T12:00:00`).toLocaleDateString('pt-BR')}…
        </div>
      )}
      {onVisibleRangeChange && availabilityState === 'error' && !availabilityReady && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-amber" role="alert">
          <span className="flex min-w-0 items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /><span><strong>Disponibilidade não verificada.</strong> {availabilityError}</span></span>
          <button className="ghost-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black" onClick={loadVisibleRange}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Tentar novamente</button>
        </div>
      )}

      {viewMode === 'week' && <p className="mb-2 text-xs font-semibold text-muted md:hidden">Deslize horizontalmente para consultar os sete dias.</p>}
      <div className="overflow-x-auto scrollbar-thin" aria-busy={!availabilityReady}>
        <div className={`relative overflow-hidden rounded-lg border border-line ${viewMode === 'week' ? 'min-w-[980px]' : 'min-w-[320px]'}`}>
          {currentLine && (
            <div className="pointer-events-none absolute left-[72px] right-0 z-20 border-t border-neon/80" style={{ top: currentLine.top }}>
              <span className="-mt-3 ml-2 inline-flex rounded-full border border-neon/40 bg-[#07110c] px-2 py-0.5 text-[11px] font-black text-neon shadow-glow">
                Agora {currentLine.label}
              </span>
            </div>
          )}
          <div className="grid" style={{ gridTemplateColumns: `72px repeat(${displayDays.length}, minmax(${viewMode === 'week' ? '130px' : '220px'}, 1fr))` }}>
            <div className="sticky top-0 z-20 border-b border-line bg-[var(--surface-elevated)] p-3 text-xs font-bold uppercase text-muted" style={{ minHeight: headerHeight }}>Hora</div>
            {displayDays.map((day) => {
              const today = isSameDate(day, now);
              return (
                <div key={formatIso(day)} className={`sticky top-0 z-20 border-b border-l border-line p-3 text-center ${today ? 'bg-[var(--surface-elevated)] text-neon' : 'bg-[var(--surface-elevated)]'}`} style={{ minHeight: headerHeight }}>
                  <p className={`text-xs font-bold ${today ? 'text-neon' : 'text-muted'}`}>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()}</p>
                  <p className="text-sm font-black">{day.getDate()}</p>
                </div>
              );
            })}
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="calendar-slot border-b border-line bg-white/[0.02] p-2 text-xs font-semibold text-muted">{hour}</div>
                {displayDays.map((day) => {
                  const isoDay = formatIso(day);
                  const slotReservations = visibleReservations.filter((reservation) => reservation.date === isoDay && reservation.startTime === hour);
                  const key = `${isoDay}-${hour}`;
                  const selected = selectedSlot === key;
                  return (
                    <div key={key} className={`calendar-slot border-b border-l border-line p-1.5 transition ${selected ? 'bg-neon/10' : 'hover:bg-white/[0.035]'}`}>
                      {slotReservations.map((reservation) => {
                        const duration = Math.max(1, (minutesFromTime(reservation.endTime) - minutesFromTime(reservation.startTime)) / 60);
                        return (
                          <Tooltip key={reservation.id} content={`${reservation.clientName} · ${reservation.courtName} · ${reservation.startTime}–${reservation.endTime} · ${reservation.status}`} placement="top" wrapperClassName="mb-1 w-full">
                          <button
                            className={`w-full rounded-md border p-2 text-left text-xs transition hover:-translate-y-0.5 ${getStatusMeta(reservation.status).className}`}
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
                          </Tooltip>
                        );
                      })}
                      {slotReservations.length === 0 && (
                        availabilityReady
                          ? selected
                            ? <div className="grid min-h-[4.5rem] place-items-center gap-2 rounded-md border border-dashed border-neon/50 bg-neon/10 p-2 text-center text-xs text-neon"><span className="font-bold">Horário livre</span><button className="neon-button inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 font-black" onClick={() => onNewReservation({ date: isoDay, startTime: hour, endTime: `${String(Number(hour.slice(0, 2)) + 1).padStart(2, '0')}:00` })}><Plus className="h-3.5 w-3.5" />Reservar</button><button className="text-[10px] font-bold underline" onClick={() => setSelectedSlot('')}>Cancelar seleção</button></div>
                            : <button className="grid h-full min-h-[4.5rem] w-full place-items-center rounded-md border border-dashed border-transparent text-xs text-transparent transition hover:border-line hover:text-muted" onClick={() => setSelectedSlot(key)} aria-label={`Selecionar horário livre ${hour} em ${isoDay}`}>livre</button>
                          : <div className="grid min-h-[4.5rem] place-items-center rounded-md border border-dashed border-line/70 bg-white/[0.02] p-2 text-center text-[10px] font-bold text-muted">{availabilityState === 'error' ? 'Não verificado' : 'Consultando…'}</div>
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
