import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../contexts/AppDataContext';
import { AdminDashboard } from '../features/admin/AdminPages';
import { initialState } from '../lib/demoData';
import type { Reservation } from '../lib/types';

beforeEach(() => {
  localStorage.clear();
});

describe('dashboard administrativo', () => {
  it('lê modalidades novas do estado demo persistido e as expõe no gráfico', () => {
    const state = structuredClone(initialState);
    const sandVolleyballReservation: Reservation = {
      ...state.reservations[0],
      id: 'r-volei-areia-test',
      code: 'PS-AREIA',
      courtId: 'c-areia-test',
      courtName: 'Arena de Areia',
      modality: 'Vôlei de Areia',
      status: 'Confirmada'
    };
    state.reservations = [...state.reservations, sandVolleyballReservation];
    localStorage.setItem('playspace-demo-state-v3', JSON.stringify({ version: 3, state }));

    render(<AppDataProvider><AdminDashboard /></AppDataProvider>);

    const modalityData = screen.getByRole('list', { name: 'Dados de reservas por modalidade' });
    expect(within(modalityData).getByText('Vôlei: 1 reserva')).toBeInTheDocument();
    expect(within(modalityData).getByText('Vôlei de Areia: 1 reserva')).toBeInTheDocument();
  });
});
