import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider, useAppData } from '../contexts/AppDataContext';
import { refundPaymentWithApi } from '../lib/api';
import { initialState } from '../lib/demoData';

let appData!: ReturnType<typeof useAppData>;

function DataProbe() {
  appData = useAppData();
  return <output>{appData.state.payments.length}</output>;
}

const renderData = () => render(
  <AppDataProvider>
    <DataProbe />
  </AppDataProvider>
);

const jsonResponse = (payload: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? 'application/json' : null },
  json: async () => payload,
  text: async () => JSON.stringify(payload)
}) as Response;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('estorno profissional de pagamentos', () => {
  it('estorna no modo demo, cancela reserva aberta, notifica e persiste sem duplicar efeitos', async () => {
    renderData();
    const admin = initialState.users.find((item) => item.id === 'u-admin')!;
    const client = initialState.users.find((item) => item.id === 'u-cliente')!;
    const payment = appData.state.payments.find((item) => {
      const reservation = appData.state.reservations.find((candidate) => candidate.id === item.reservationId);
      return item.status === 'Aprovado' && reservation?.status === 'Confirmada';
    })!;
    const reservation = appData.state.reservations.find((item) => item.id === payment.reservationId)!;

    await expect(appData.refundPayment(payment.id, client)).rejects.toThrow(/somente administradores/i);

    await act(async () => {
      await appData.refundPayment(payment.id, admin);
    });

    expect(appData.state.payments.find((item) => item.id === payment.id)).toMatchObject({
      status: 'Cancelado',
      transactionCode: payment.transactionCode
    });
    expect(appData.state.payments.find((item) => item.id === payment.id)?.refundedAt).toBeTruthy();
    expect(appData.state.reservations.find((item) => item.id === reservation.id)?.status).toBe('Cancelada');
    expect(appData.state.notifications[reservation.clientId]?.[0]).toMatchObject({
      title: 'Pagamento estornado',
      type: 'Pagamento'
    });
    expect(appData.state.activities[0]).toMatchObject({ actor: admin.name, category: 'Pagamento' });

    const notificationCount = appData.state.notifications[reservation.clientId].length;
    const activityCount = appData.state.activities.length;
    await expect(appData.refundPayment(payment.id, admin)).rejects.toThrow(/somente pagamentos aprovados/i);
    expect(appData.state.notifications[reservation.clientId]).toHaveLength(notificationCount);
    expect(appData.state.activities).toHaveLength(activityCount);

    await waitFor(() => {
      const persisted = JSON.parse(localStorage.getItem('playspace-demo-state-v3') ?? '{}');
      const persistedPayment = persisted.state?.payments?.find((item: { id: string }) => item.id === payment.id);
      expect(persistedPayment).toMatchObject({ status: 'Cancelado' });
      expect(persistedPayment.refundedAt).toBeTruthy();
    });
  });

  it('mantém reserva concluída ao estornar seu pagamento', async () => {
    renderData();
    const admin = initialState.users.find((item) => item.id === 'u-admin')!;
    const completed = appData.state.reservations.find((item) => item.status === 'Concluída')!;
    const payment = appData.state.payments.find((item) => item.reservationId === completed.id && item.status === 'Aprovado')!;

    await act(async () => {
      await appData.refundPayment(payment.id, admin);
    });

    expect(appData.state.payments.find((item) => item.id === payment.id)?.status).toBe('Cancelado');
    expect(appData.state.reservations.find((item) => item.id === completed.id)?.status).toBe('Concluída');
  });

  it('chama o endpoint autenticado e mapeia exclusivamente o DTO de estorno', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({
      paymentId: 42,
      reservationId: 77,
      reservationCode: 'PS-0077',
      reservationStatus: 'CANCELADA',
      method: 'PIX',
      status: 'CANCELADO',
      amount: 120,
      transactionCode: 'PAY-0077',
      paidAt: '2026-07-15T10:00:00-03:00',
      refundedAt: '2026-07-15T11:00:00-03:00'
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(refundPaymentWithApi('42', 'token-admin')).resolves.toEqual({
      payment: {
        id: '42',
        reservationId: '77',
        reservationCode: 'PS-0077',
        method: 'PIX',
        status: 'Cancelado',
        amount: 120,
        transactionCode: 'PAY-0077',
        paidAt: '2026-07-15T10:00:00-03:00',
        refundedAt: '2026-07-15T11:00:00-03:00'
      },
      reservationStatus: 'Cancelada'
    });

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/payments\/42\/refund$/);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe('Bearer token-admin');
  });
});
