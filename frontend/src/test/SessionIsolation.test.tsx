import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  fetchCoreData: vi.fn()
}));

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return { ...actual, fetchCoreData: apiMocks.fetchCoreData };
});

import { AppDataProvider, useAppData } from '../contexts/AppDataContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { initialState } from '../lib/demoData';

const admin = initialState.users.find((user) => user.role === 'ADMIN')!;

const coreData = (courtName: string) => ({
  courts: [{ ...initialState.courts[0], id: `court-${courtName}`, name: courtName }],
  reservations: [],
  payments: [],
  notifications: [],
  users: [admin]
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

function DataProbe() {
  const { state, hydrateFromApi, resetSessionData } = useAppData();
  return (
    <>
      <span data-testid="court-name">{state.courts[0]?.name}</span>
      <span data-testid="sensitive-user">{state.users.some((user) => user.email === 'secret@example.com') ? 'vazou' : 'isolado'}</span>
      <button onClick={() => void hydrateFromApi('token-a', admin)}>Hidratar A</button>
      <button onClick={() => void hydrateFromApi('token-b', admin)}>Hidratar B</button>
      <button onClick={resetSessionData}>Limpar sessão</button>
    </>
  );
}

function AuthProbe() {
  const { user } = useAuth();
  return <span data-testid="auth-state">{user?.email ?? 'sem-sessão'}</span>;
}

beforeEach(() => {
  localStorage.clear();
  apiMocks.fetchCoreData.mockReset();
});

describe('isolamento de sessão', () => {
  it('mantém a hidratação mais recente quando uma resposta antiga chega por último', async () => {
    const first = deferred<ReturnType<typeof coreData>>();
    const second = deferred<ReturnType<typeof coreData>>();
    apiMocks.fetchCoreData.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<AppDataProvider><DataProbe /></AppDataProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Hidratar A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hidratar B' }));

    await act(async () => second.resolve(coreData('Sessão B')));
    expect(await screen.findByText('Sessão B')).toBeInTheDocument();

    await act(async () => first.resolve(coreData('Sessão A obsoleta')));
    expect(screen.getByTestId('court-name')).toHaveTextContent('Sessão B');
    expect(screen.queryByText('Sessão A obsoleta')).not.toBeInTheDocument();
  });

  it('migra o armazenamento antigo sem carregar ou persistir dados identificáveis', async () => {
    localStorage.setItem('playspace-state-v1', JSON.stringify({
      users: [{ email: 'secret@example.com' }],
      courts: [{ name: 'Quadra privada' }],
      preferences: { theme: 'light', tourDone: true, favoriteCourts: ['private-court'] }
    }));

    render(<AppDataProvider><DataProbe /></AppDataProvider>);
    expect(screen.getByTestId('sensitive-user')).toHaveTextContent('isolado');

    await waitFor(() => {
      const persisted = JSON.parse(localStorage.getItem('playspace-state-v1') ?? '{}');
      expect(persisted).toEqual({ version: 2, preferences: { theme: 'light', tourDone: true } });
    });
  });

  it('ignora expiração de token antigo e encerra somente a sessão correspondente', async () => {
    localStorage.setItem('playspace-session-v2', JSON.stringify({ user: admin, token: 'token-b', source: 'api' }));
    render(<AppDataProvider><AuthProvider><AuthProbe /></AuthProvider></AppDataProvider>);

    expect(screen.getByTestId('auth-state')).toHaveTextContent(admin.email);
    act(() => window.dispatchEvent(new CustomEvent('playspace:session-expired', { detail: { token: 'token-a' } })));
    expect(screen.getByTestId('auth-state')).toHaveTextContent(admin.email);

    act(() => window.dispatchEvent(new CustomEvent('playspace:session-expired', { detail: { token: 'token-b' } })));
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('sem-sessão'));
  });
});
