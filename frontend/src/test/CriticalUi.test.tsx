import { Mail, Search } from 'lucide-react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconField } from '../components/IconField';
import { Modal } from '../components/Modal';
import { NotificationBell } from '../components/NotificationBell';
import { PaymentFlow } from '../components/PaymentFlow';
import { StatusBadge } from '../components/StatusBadge';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { AppDataProvider } from '../contexts/AppDataContext';
import { initialState } from '../lib/demoData';

describe('componentes críticos de interface', () => {
  it('reserva espaço para ícones sem sobrepor o conteúdo', () => {
    render(<IconField label="Busca" leadingIcon={<Search />} trailingIcon={<Mail />} placeholder="Texto longo para validar o espaçamento" />);
    const input = screen.getByRole('textbox', { name: 'Busca' });
    expect(input).toHaveStyle({ paddingInlineStart: '2.75rem', paddingInlineEnd: '2.75rem' });
  });

  it('fecha o modal com Escape, bloqueia scroll e devolve o foco', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<><button>Origem</button><Modal title="Nova reserva" open={false} onClose={onClose}><button>Salvar</button></Modal></>);
    const origin = screen.getByRole('button', { name: 'Origem' });
    await user.click(origin);
    rerender(<><button>Origem</button><Modal title="Nova reserva" open onClose={onClose}><button>Salvar</button></Modal></>);

    expect(await screen.findByRole('dialog', { name: 'Nova reserva' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<><button>Origem</button><Modal title="Nova reserva" open={false} onClose={onClose}><button>Salvar</button></Modal></>);
    expect(document.body.style.overflow).toBe('');
    expect(screen.getByRole('button', { name: 'Origem' })).toHaveFocus();
  });

  it('mantém o status pendente com semântica de alerta', () => {
    render(<StatusBadge status="Pendente" />);
    expect(screen.getByLabelText('Status: Pendente')).toHaveClass('text-[var(--warning)]');
  });

  it('expõe formas de pagamento como radios nativos operáveis', async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <PaymentFlow reservation={initialState.reservations[0]} onPaid={vi.fn()} />
      </AppDataProvider>
    );

    expect(screen.getByRole('group', { name: 'Forma de pagamento' })).toBeInTheDocument();
    const credit = screen.getByRole('radio', { name: /Cartão de Crédito/i });
    await user.click(credit);
    expect(credit).toBeChecked();
  });

  it('anuncia e fecha a central de notificações com Escape', async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <NotificationBell user={initialState.users[0]} />
      </AppDataProvider>
    );

    const trigger = screen.getByRole('button', { name: /Notificações,/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Central de notificações' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('bloqueia horários livres até validar cada período visível da agenda', async () => {
    const user = userEvent.setup();
    const pendingResolvers: Array<() => void> = [];
    const loadAvailability = vi.fn(() => new Promise<void>((resolve) => pendingResolvers.push(resolve)));

    render(
      <WeeklyCalendar
        reservations={[]}
        onReservationClick={vi.fn()}
        onNewReservation={vi.fn()}
        onVisibleRangeChange={loadAvailability}
      />
    );

    await waitFor(() => expect(loadAvailability).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Nova reserva' })).toBeDisabled();
    expect(screen.getAllByText('Consultando…').length).toBeGreaterThan(0);

    await act(async () => pendingResolvers[0]());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Nova reserva' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Próxima semana' }));
    await waitFor(() => expect(loadAvailability).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Nova reserva' })).toBeDisabled();

    await act(async () => pendingResolvers[1]());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Nova reserva' })).toBeEnabled());
  });
});
