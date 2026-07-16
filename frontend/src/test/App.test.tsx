import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { AppDataProvider } from '../contexts/AppDataContext';
import { AuthProvider } from '../contexts/AuthContext';

function renderApp(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppDataProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppDataProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('PlaySpace frontend', () => {
  it('logs in as admin and shows the dashboard', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click((await screen.findAllByRole('button', { name: /preencher acesso de administrador/i }))[0]);
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByRole('heading', { name: /dashboard/i }, { timeout: 15_000 })).toBeInTheDocument();
    expect(screen.getByText(/reservas hoje/i)).toBeInTheDocument();
    expect(screen.getByText(/receita do mês/i)).toBeInTheDocument();
  });

  it('logs in as client and navigates to reservations', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click((await screen.findAllByRole('button', { name: /preencher acesso de cliente/i }))[0]);
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await user.click((await screen.findAllByRole('link', { name: /reservas/i }, { timeout: 5000 }))[0]);

    expect(await screen.findByRole('heading', { name: /minhas reservas/i }, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^próximas$/i })).toBeInTheDocument();
  });

  it('creates a client reservation and approves PIX payment demo', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click((await screen.findAllByRole('button', { name: /preencher acesso de cliente/i }))[0]);
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    await user.click((await screen.findAllByRole('link', { name: /nova/i }, { timeout: 5000 }))[0]);

    const future = new Date();
    future.setDate(future.getDate() + 30);
    const dateInput = await screen.findByLabelText(/data/i, {}, { timeout: 5000 });
    await user.clear(dateInput);
    await user.type(dateInput, future.toISOString().slice(0, 10));
    await user.click(screen.getByRole('button', { name: /criar reserva/i }));

    expect(await screen.findByRole('heading', { name: /pagamento da reserva/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /pagar com pix/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /pagamento da reserva/i })).not.toBeInTheDocument();
    }, { timeout: 1500 });
  });
});
