import { AlertCircle, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { getStatusMeta } from '../lib/status';
import type { Modality, Reservation, ReservationFormInput, ReservationStatus, WeekDay } from '../lib/types';
import { StatusBadge } from './StatusBadge';
import { Tooltip } from './Tooltip';

const headerHeight = 58;
const weekDays: WeekDay[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const mondayOf = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day + (day === 0 ? -6 : 1));
  result.setHours(0, 0, 0, 0);
  return result;
};

const firstOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatIso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDate = (a: Date, b: Date) => formatIso(a) === formatIso(b);

const minutesFromTime = (time: string) => {
  const [hoursPart = 0, minutesPart = 0] = time.split(':').map(Number);
  return hoursPart * 60 + minutesPart;
};

const timeFromMinutes = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const monthGrid = (cursor: Date) => {
  const start = mondayOf(firstOfMonth(cursor));
  const endOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const lastDayOffset = endOfMonth.getDay() === 0 ? 6 : endOfMonth.getDay() - 1;
  const end = addDays(endOfMonth, 6 - lastDayOffset);
  const length = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Array.from({ length }, (_, index) => addDays(start, index));
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
  const { state } = useAppData();
  const settings = state.settings;
  const openingTime = settings.openingTime ?? settings.hours.split(' - ')[0] ?? '08:00';
  const closingTime = settings.closingTime ?? settings.hours.split(' - ')[1] ?? '22:00';
  const openingMinutes = minutesFromTime(openingTime);
  const closingMinutes = minutesFromTime(closingTime);
  const slotMinutes = Math.max(15, settings.slotMinutes ?? 60);
  const minimumReservationMinutes = Math.max(15, settings.minimumReservationMinutes || slotMinutes);
  const operatingDays = settings.operatingDays ?? weekDays;
  const maximumAdvanceDays = Math.max(1, settings.maximumAdvanceDays ?? 90);
  const hasReservableWindow = closingMinutes - openingMinutes >= minimumReservationMinutes;
  const rowHeight = slotMinutes <= 30 ? 56 : 72;

  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [dayCursor, setDayCursor] = useState(() => new Date());
  const [monthCursor, setMonthCursor] = useState(() => firstOfMonth(new Date()));
  const [monthSelectedDate, setMonthSelectedDate] = useState(() => formatIso(new Date()));
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>(() => window.innerWidth < 640 ? 'day' : 'week');
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

  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const monthDays = useMemo(() => monthGrid(monthCursor), [monthCursor]);
  const displayDays = viewMode === 'week' ? week : viewMode === 'month' ? monthDays : [dayCursor];
  const visibleStart = formatIso(displayDays[0]);
  const visibleEnd = formatIso(displayDays[displayDays.length - 1]);
  const visibleRangeKey = `${visibleStart}:${visibleEnd}`;

  const slots = useMemo(() => {
    if (closingMinutes <= openingMinutes) return [];
    const result: string[] = [];
    for (let minute = openingMinutes; minute < closingMinutes; minute += slotMinutes) result.push(timeFromMinutes(minute));
    return result;
  }, [closingMinutes, openingMinutes, slotMinutes]);

  const maxBookableDate = useMemo(() => addDays(new Date(), maximumAdvanceDays), [maximumAdvanceDays]);
  const today = formatIso(now);
  const isOperatingDay = useCallback((date: Date) => operatingDays.includes(weekDays[date.getDay()]), [operatingDays]);
  const canCreateOn = useCallback((date: Date) => {
    const iso = formatIso(date);
    return isOperatingDay(date) && iso >= today && iso <= formatIso(maxBookableDate);
  }, [isOperatingDay, maxBookableDate, today]);

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
    () => reservations.filter((reservation) => {
      const insideRange = reservation.date >= visibleStart && reservation.date <= visibleEnd;
      const courtOk = !courtFilter || courtFilter === 'Todas' || reservation.courtId === courtFilter;
      const modalityOk = !modalityFilter || modalityFilter === 'Todas' || reservation.modality === modalityFilter;
      return insideRange && courtOk && modalityOk;
    }),
    [courtFilter, modalityFilter, reservations, visibleEnd, visibleStart]
  );

  const reservationsByDate = useMemo(() => {
    const result = new Map<string, Reservation[]>();
    visibleReservations.forEach((reservation) => result.set(reservation.date, [...(result.get(reservation.date) ?? []), reservation]));
    result.forEach((items) => items.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return result;
  }, [visibleReservations]);

  const reservationsBySlot = useMemo(() => {
    const result = new Map<string, Reservation[]>();
    visibleReservations.forEach((reservation) => {
      const start = minutesFromTime(reservation.startTime);
      if (start < openingMinutes || start >= closingMinutes) return;
      const slotStart = openingMinutes + Math.floor((start - openingMinutes) / slotMinutes) * slotMinutes;
      const key = `${reservation.date}-${timeFromMinutes(slotStart)}`;
      result.set(key, [...(result.get(key) ?? []), reservation]);
    });
    return result;
  }, [closingMinutes, openingMinutes, slotMinutes, visibleReservations]);

  const currentLine = useMemo(() => {
    if (viewMode === 'month') return null;
    const dayIndex = displayDays.findIndex((day) => isSameDate(day, now));
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (dayIndex < 0 || currentMinutes < openingMinutes || currentMinutes > closingMinutes) return null;
    return {
      top: headerHeight + ((currentMinutes - openingMinutes) / slotMinutes) * rowHeight,
      label: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  }, [closingMinutes, displayDays, now, openingMinutes, rowHeight, slotMinutes, viewMode]);

  const goToday = () => {
    const current = new Date();
    setWeekStart(mondayOf(current));
    setDayCursor(current);
    setMonthCursor(firstOfMonth(current));
    setMonthSelectedDate(formatIso(current));
    setSelectedSlot('');
  };

  const moveBackward = () => {
    if (viewMode === 'week') setWeekStart((date) => addDays(date, -7));
    else if (viewMode === 'day') setDayCursor((date) => addDays(date, -1));
    else setMonthCursor((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
  };

  const moveForward = () => {
    if (viewMode === 'week') setWeekStart((date) => addDays(date, 7));
    else if (viewMode === 'day') setDayCursor((date) => addDays(date, 1));
    else setMonthCursor((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));
  };

  const previousNavigationLabel = viewMode === 'week' ? 'Semana anterior' : viewMode === 'day' ? 'Dia anterior' : 'Mês anterior';
  const nextNavigationLabel = viewMode === 'week' ? 'Próxima semana' : viewMode === 'day' ? 'Próximo dia' : 'Próximo mês';
  const periodLabel = viewMode === 'week'
    ? `${week[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${week[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
    : viewMode === 'day'
      ? dayCursor.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
      : monthCursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const createForDate = (date: Date, startTime = openingTime) => {
    const start = minutesFromTime(startTime);
    const end = Math.min(start + minimumReservationMinutes, closingMinutes);
    onNewReservation({ date: formatIso(date), startTime, endTime: timeFromMinutes(end) });
  };

  const monthlySelectedReservations = reservationsByDate.get(monthSelectedDate) ?? [];
  const monthlySelectedDay = new Date(`${monthSelectedDate}T12:00:00`);

  return (
    <section className="glass-panel rounded-lg p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neon/25 bg-neon/10 px-3 py-1 text-xs font-bold text-neon">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Calendário {viewMode === 'month' ? 'mensal' : viewMode === 'day' ? 'diário' : 'semanal'}
          </div>
          <h2 className="text-xl font-black">Agenda de Quadras</h2>
          <p className="text-sm capitalize text-muted">{periodLabel}</p>
          <p className="mt-1 text-xs text-muted">Funcionamento: {openingTime}–{closingTime} · intervalos de {slotMinutes} min</p>
        </div>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <div className="grid grid-cols-3 rounded-lg border border-line p-1 sm:inline-flex" aria-label="Visualização da agenda">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button key={mode} className={`min-h-10 rounded-md px-3 py-1.5 text-xs font-bold ${viewMode === mode ? 'bg-neon text-[#07110c]' : 'text-muted'}`} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode}>
                {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[auto_auto_auto_minmax(0,1fr)] items-center gap-2 sm:flex">
            <button className="ghost-button min-h-10 rounded-lg px-3 py-2 text-sm font-bold" onClick={goToday}>Hoje</button>
            <button className="ghost-button min-h-10 min-w-10 rounded-lg p-2" aria-label={previousNavigationLabel} onClick={moveBackward}>
              <ChevronLeft className="mx-auto h-4 w-4" aria-hidden="true" />
            </button>
            <button className="ghost-button min-h-10 min-w-10 rounded-lg p-2" aria-label={nextNavigationLabel} onClick={moveForward}>
              <ChevronRight className="mx-auto h-4 w-4" aria-hidden="true" />
            </button>
            <button className="neon-button inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:px-4" onClick={() => onNewReservation()} disabled={!availabilityReady}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova reserva
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {(['Pendente', 'Confirmada', 'Em andamento', 'Concluída', 'Cancelada'] as ReservationStatus[]).map((status) => <StatusBadge key={status} status={status} compact />)}
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
          <button className="ghost-button inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-xs font-black" onClick={loadVisibleRange}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Tentar novamente</button>
        </div>
      )}

      {viewMode === 'month' ? (
        <div aria-busy={!availabilityReady}>
          <div className="grid grid-cols-7 overflow-hidden rounded-t-lg border border-line bg-[var(--surface-elevated)] text-center text-[10px] font-black uppercase text-muted sm:text-xs">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label) => <div className="border-r border-line px-1 py-2 last:border-r-0" key={label}>{label}</div>)}
          </div>
          <div className="grid grid-cols-7 overflow-hidden rounded-b-lg border-x border-b border-line">
            {monthDays.map((day) => {
              const iso = formatIso(day);
              const items = reservationsByDate.get(iso) ?? [];
              const currentMonth = day.getMonth() === monthCursor.getMonth();
              const operating = isOperatingDay(day);
              const selected = monthSelectedDate === iso;
              const bookable = canCreateOn(day) && availabilityReady && hasReservableWindow;
              return (
                <div key={iso} className={`relative min-h-14 min-w-0 border-b border-r border-line p-1 transition sm:min-h-32 sm:p-2 ${selected ? 'bg-neon/10 ring-1 ring-inset ring-neon/60' : 'hover:bg-white/[0.035]'} ${currentMonth ? '' : 'opacity-45'} ${operating ? '' : 'bg-white/[0.02]'}`}>
                  <button type="button" className="flex w-full items-center gap-1 text-left" onClick={() => setMonthSelectedDate(iso)} aria-label={`${day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}, ${items.length} reserva${items.length === 1 ? '' : 's'}${operating ? '' : ', fechado'}`}>
                    <span className={`inline-grid h-7 w-7 place-items-center rounded-full text-xs font-black ${isSameDate(day, now) ? 'bg-neon text-[#07110c]' : ''}`}>{day.getDate()}</span>
                    {!operating && <span className="hidden text-[10px] font-bold text-muted sm:inline">Fechado</span>}
                    {items.length > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-cyan/20 px-1 text-[10px] font-black text-cyan sm:hidden">{items.length}</span>}
                  </button>
                  <div className="mt-1 hidden gap-1 sm:grid">
                    {items.slice(0, 2).map((reservation) => (
                      <button type="button" key={reservation.id} className={`block w-full truncate rounded border px-1.5 py-1 text-left text-[10px] font-bold ${getStatusMeta(reservation.status).className}`} onClick={() => onReservationClick(reservation)}>
                        {reservation.startTime} · {reservation.courtName}
                      </button>
                    ))}
                    {items.length > 2 && <span className="text-[10px] font-bold text-muted">+{items.length - 2} reserva(s)</span>}
                  </div>
                  {bookable && <button type="button" className="absolute bottom-1 right-1 hidden h-7 w-7 place-items-center rounded-md border border-neon/30 bg-neon/10 text-neon sm:grid" aria-label={`Criar reserva em ${iso}`} onClick={() => createForDate(day)}><Plus className="h-3.5 w-3.5" aria-hidden="true" /></button>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 rounded-lg border border-line p-3 sm:hidden">
            <div className="flex items-center justify-between gap-2">
              <div><p className="text-xs font-bold uppercase text-muted">Dia selecionado</p><h3 className="text-sm font-black capitalize">{monthlySelectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h3></div>
              <button className="neon-button inline-flex min-h-10 items-center gap-1 rounded-md px-3 py-2 text-xs font-black disabled:opacity-50" disabled={!canCreateOn(monthlySelectedDay) || !availabilityReady || !hasReservableWindow} onClick={() => createForDate(monthlySelectedDay)}><Plus className="h-3.5 w-3.5" />Reservar</button>
            </div>
            <div className="mt-3 grid gap-2">
              {monthlySelectedReservations.map((reservation) => <button key={reservation.id} className={`rounded-md border p-2 text-left text-xs ${getStatusMeta(reservation.status).className}`} onClick={() => onReservationClick(reservation)}><strong>{reservation.startTime}–{reservation.endTime}</strong><span className="ml-2">{reservation.courtName}</span></button>)}
              {monthlySelectedReservations.length === 0 && <p className="rounded-md border border-dashed border-line p-3 text-center text-xs text-muted">Nenhuma reserva neste dia.</p>}
            </div>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'week' && <p className="mb-2 text-xs font-semibold text-muted md:hidden">Deslize horizontalmente para consultar os sete dias.</p>}
          <div className="max-h-[70vh] overflow-auto scrollbar-thin" aria-busy={!availabilityReady}>
            <div className={`relative overflow-hidden rounded-lg border border-line ${viewMode === 'week' ? 'min-w-[980px]' : 'min-w-[300px]'}`}>
              {currentLine && (
                <div className="pointer-events-none absolute left-[72px] right-0 z-20 border-t border-neon/80" style={{ top: currentLine.top }}>
                  <span className="-mt-3 ml-2 inline-flex rounded-full border border-neon/40 bg-[#07110c] px-2 py-0.5 text-[11px] font-black text-neon shadow-glow">Agora {currentLine.label}</span>
                </div>
              )}
              <div className="grid" style={{ gridTemplateColumns: `72px repeat(${displayDays.length}, minmax(${viewMode === 'week' ? '130px' : '220px'}, 1fr))` }}>
                <div className="sticky top-0 z-20 border-b border-line bg-[var(--surface-elevated)] p-3 text-xs font-bold uppercase text-muted" style={{ minHeight: headerHeight }}>Hora</div>
                {displayDays.map((day) => {
                  const currentDay = isSameDate(day, now);
                  const operating = isOperatingDay(day);
                  return (
                    <div key={formatIso(day)} className={`sticky top-0 z-20 border-b border-l border-line p-3 text-center ${currentDay ? 'bg-[var(--surface-elevated)] text-neon' : 'bg-[var(--surface-elevated)]'}`} style={{ minHeight: headerHeight }}>
                      <p className={`text-xs font-bold ${currentDay ? 'text-neon' : 'text-muted'}`}>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()}</p>
                      <p className="text-sm font-black">{day.getDate()} {!operating && <span className="text-[10px] text-muted">· Fechado</span>}</p>
                    </div>
                  );
                })}
                {slots.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="calendar-slot border-b border-line bg-white/[0.02] p-2 text-xs font-semibold text-muted" style={{ minHeight: rowHeight }}>{hour}</div>
                    {displayDays.map((day) => {
                      const isoDay = formatIso(day);
                      const key = `${isoDay}-${hour}`;
                      const slotReservations = reservationsBySlot.get(key) ?? [];
                      const selected = selectedSlot === key;
                      const slotEnd = minutesFromTime(hour) + minimumReservationMinutes;
                      const bookable = availabilityReady && canCreateOn(day) && slotEnd <= closingMinutes;
                      return (
                        <div key={key} className={`calendar-slot border-b border-l border-line p-1.5 transition ${selected ? 'bg-neon/10' : 'hover:bg-white/[0.035]'}`} style={{ minHeight: rowHeight }}>
                          {slotReservations.map((reservation) => {
                            const durationMinutes = Math.max(1, minutesFromTime(reservation.endTime) - minutesFromTime(reservation.startTime));
                            return (
                              <Tooltip key={reservation.id} content={`${reservation.clientName} · ${reservation.courtName} · ${reservation.startTime}–${reservation.endTime} · ${reservation.status}`} placement="top" wrapperClassName="mb-1 w-full">
                                <button className={`w-full rounded-md border p-2 text-left text-xs transition hover:-translate-y-0.5 ${getStatusMeta(reservation.status).className}`} onClick={() => onReservationClick(reservation)}>
                                  <span className="flex items-center justify-between gap-2"><strong className="block text-[var(--text)]">{reservation.startTime} - {reservation.endTime}</strong><span className="text-[10px] font-bold text-muted">{durationMinutes} min</span></span>
                                  <span className="mt-1 block truncate font-semibold">{reservation.courtName}</span>
                                  <span className="block truncate text-muted">{reservation.modality}</span>
                                  <span className="mt-2 block"><StatusBadge status={reservation.status} compact /></span>
                                </button>
                              </Tooltip>
                            );
                          })}
                          {slotReservations.length === 0 && (
                            !isOperatingDay(day)
                              ? <div className="grid h-full min-h-11 place-items-center text-[10px] font-bold text-muted">Fechado</div>
                              : bookable
                                ? selected
                                  ? <div className="grid min-h-11 place-items-center gap-2 rounded-md border border-dashed border-neon/50 bg-neon/10 p-2 text-center text-xs text-neon"><span className="font-bold">Horário livre</span><button className="neon-button inline-flex min-h-9 items-center justify-center gap-1 rounded-md px-2 py-1 font-black" onClick={() => createForDate(day, hour)}><Plus className="h-3.5 w-3.5" />Reservar</button><button className="min-h-8 text-[10px] font-bold underline" onClick={() => setSelectedSlot('')}>Cancelar seleção</button></div>
                                  : <button className="grid h-full min-h-11 w-full place-items-center rounded-md border border-dashed border-transparent text-xs text-transparent transition hover:border-line hover:text-muted focus:border-neon focus:text-muted" onClick={() => setSelectedSlot(key)} aria-label={`Selecionar horário livre ${hour} em ${isoDay}`}>livre</button>
                                : <div className="grid h-full min-h-11 place-items-center rounded-md border border-dashed border-line/70 bg-white/[0.02] p-2 text-center text-[10px] font-bold text-muted">{availabilityState === 'error' ? 'Não verificado' : availabilityState === 'loading' ? 'Consultando…' : isoDay < today ? 'Encerrado' : isoDay > formatIso(maxBookableDate) ? 'Fora do prazo' : 'Indisponível'}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
