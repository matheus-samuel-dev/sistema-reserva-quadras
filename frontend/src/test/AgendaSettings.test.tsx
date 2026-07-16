import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservationForm } from '../components/ReservationForm';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { initialState } from '../lib/demoData';
import type { PlaySpaceState, Reservation } from '../lib/types';

const appDataMock = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
  createReservation: vi.fn(),
  ensureAvailabilityRange: vi.fn()
}));

vi.mock('../contexts/AppDataContext', () => ({
  useAppData: () => appDataMock.current
}));

const configuredState = (): PlaySpaceState => ({
  ...initialState,
  settings: {
    ...initialState.settings,
    openingTime: '10:00',
    closingTime: '12:00',
    hours: '10:00 - 12:00',
    operatingDays: ['MONDAY'],
    minimumReservationMinutes: 45,
    maximumAdvanceDays: 7,
    slotMinutes: 30
  }
});

describe('agenda orientada pelas configurações operacionais', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T09:00:00'));
    appDataMock.createReservation.mockReset();
    appDataMock.ensureAvailabilityRange.mockReset();
    appDataMock.current = {
      state: configuredState(),
      dataSource: 'demo',
      createReservation: appDataMock.createReservation,
      ensureAvailabilityRange: appDataMock.ensureAvailabilityRange
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('monta os slots com abertura, fechamento, intervalo e duração mínima configurados', () => {
    const onNewReservation = vi.fn();
    render(<WeeklyCalendar reservations={[]} onReservationClick={vi.fn()} onNewReservation={onNewReservation} />);

    expect(screen.getByText('Funcionamento: 10:00–12:00 · intervalos de 30 min')).toBeInTheDocument();
    expect(screen.getAllByText('10:30').length).toBeGreaterThan(0);
    expect(screen.queryByText('08:00')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar horário livre 10:00 em 2026-07-13' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));

    expect(onNewReservation).toHaveBeenCalledWith({ date: '2026-07-13', startTime: '10:00', endTime: '10:45' });
  });

  it('oferece visão mensal, seleção móvel do dia e detalhes acionáveis', () => {
    const onReservationClick = vi.fn();
    const reservation: Reservation = {
      ...initialState.reservations[0],
      id: 'reservation-month',
      date: '2026-07-13',
      startTime: '10:30',
      endTime: '11:30'
    };
    render(<WeeklyCalendar reservations={[reservation]} onReservationClick={onReservationClick} onNewReservation={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mês' }));
    expect(screen.getByText('Calendário mensal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /13 de julho, 1 reserva$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText(`${reservation.startTime} · ${reservation.courtName}`));
    expect(onReservationClick).toHaveBeenCalledWith(reservation);
  });

  it('aplica dias, antecedência, duração e grade no formulário', () => {
    const actor = initialState.users.find((user) => user.role === 'CLIENTE')!;
    render(<ReservationForm actor={actor} initialValues={{ date: '2026-07-13' }} onCreated={vi.fn()} />);

    const dateInput = screen.getByLabelText('Data da reserva');
    const startInput = screen.getByLabelText('Horário inicial');
    const endInput = screen.getByLabelText('Horário final');
    expect(dateInput).toHaveAttribute('max', '2026-07-20');
    expect(startInput).toHaveAttribute('min', '10:00');
    expect(startInput).toHaveAttribute('max', '12:00');
    expect(startInput).toHaveAttribute('step', '1800');
    expect(startInput).toHaveValue('10:00');
    expect(endInput).toHaveValue('10:45');
    expect(screen.getByRole('button', { name: 'Criar reserva' })).toBeEnabled();

    fireEvent.change(dateInput, { target: { value: '2026-07-14' } });
    expect(screen.getByText('A unidade não funciona no dia da semana selecionado.')).toBeInTheDocument();

    fireEvent.change(dateInput, { target: { value: '2026-07-27' } });
    expect(screen.getByText('Reservas podem ser feitas com no máximo 7 dias de antecedência.')).toBeInTheDocument();
  });
});
