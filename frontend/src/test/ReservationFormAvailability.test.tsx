import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReservationForm } from '../components/ReservationForm';
import { initialState } from '../lib/demoData';

const appDataMock = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
  ensureAvailabilityRange: vi.fn(),
  createReservation: vi.fn()
}));

vi.mock('../contexts/AppDataContext', () => ({
  useAppData: () => appDataMock.current
}));

const futureIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

describe('verificação de disponibilidade no formulário de reserva', () => {
  beforeEach(() => {
    appDataMock.ensureAvailabilityRange.mockReset();
    appDataMock.createReservation.mockReset();
    appDataMock.current = {
      state: initialState,
      dataSource: 'api',
      ensureAvailabilityRange: appDataMock.ensureAvailabilityRange,
      createReservation: appDataMock.createReservation
    };
  });

  it('não anuncia nem permite reservar uma data até a API verificá-la', async () => {
    const firstDate = futureIso(10);
    const secondDate = futureIso(11);
    let resolveFirst!: () => void;
    let rejectSecond!: (reason: Error) => void;
    appDataMock.ensureAvailabilityRange
      .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectSecond = reject; }));

    const actor = initialState.users.find((user) => user.role === 'CLIENTE')!;
    render(<ReservationForm actor={actor} initialValues={{ date: firstDate }} onCreated={vi.fn()} />);

    await waitFor(() => expect(appDataMock.ensureAvailabilityRange).toHaveBeenCalledWith(firstDate, firstDate));
    expect(screen.getByRole('status')).toHaveTextContent('Consultando a disponibilidade');
    expect(screen.queryByText(/Horário disponível/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verificando horário/i })).toBeDisabled();

    await act(async () => resolveFirst());
    await waitFor(() => expect(screen.getByText(/Horário disponível/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Criar reserva' })).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Data da reserva'), { target: { value: secondDate } });
    await waitFor(() => expect(appDataMock.ensureAvailabilityRange).toHaveBeenCalledWith(secondDate, secondDate));
    expect(screen.queryByText(/Horário disponível/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verificando horário/i })).toBeDisabled();

    await act(async () => rejectSecond(new Error('Agenda temporariamente indisponível.')));
    expect(await screen.findByRole('alert')).toHaveTextContent('Disponibilidade não verificada');
    expect(screen.getByRole('button', { name: 'Criar reserva' })).toBeDisabled();
    expect(appDataMock.createReservation).not.toHaveBeenCalled();
  });

  it('preserva o fluxo imediato no modo demonstração', () => {
    appDataMock.current = {
      ...appDataMock.current,
      dataSource: 'demo'
    };
    const actor = initialState.users.find((user) => user.role === 'CLIENTE')!;

    render(<ReservationForm actor={actor} initialValues={{ date: futureIso(10) }} onCreated={vi.fn()} />);

    expect(screen.getByText(/Horário disponível/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar reserva' })).toBeEnabled();
    expect(appDataMock.ensureAvailabilityRange).not.toHaveBeenCalled();
  });
});
