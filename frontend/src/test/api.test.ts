import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askAiWithApi,
  enrollInChampionshipWithApi,
  fetchAvailabilityRangeWithApi,
  fetchCoreData,
  likePostWithApi
} from '../lib/api';

const jsonResponse = (payload: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? 'application/json' : null },
  json: async () => payload,
  text: async () => JSON.stringify(payload)
}) as Response;

describe('integracao da disponibilidade da agenda', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mescla slots ocupados sem duplicar reservas proprias ou expor dados privados', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/courts')) {
        return jsonResponse([{
          id: 10,
          name: 'Quadra Central',
          modality: 'TENIS',
          status: 'DISPONIVEL',
          pricePerHour: 100,
          playerCapacity: 4
        }]);
      }

      if (url.endsWith('/reservations/my')) {
        return jsonResponse([{
          id: 41,
          code: 'RES-0041',
          client: { id: 7, name: 'Cliente atual', email: 'cliente@teste.com', role: 'CLIENTE', active: true },
          court: { id: 10, name: 'Quadra Central', modality: 'TENIS' },
          modality: 'TENIS',
          date: '2026-07-20',
          startTime: '10:00:00',
          endTime: '11:00:00',
          status: 'CONFIRMADA',
          totalValue: 100
        }]);
      }

      if (/\/reservations\/availability\?start=\d{4}-\d{2}-\d{2}&end=\d{4}-\d{2}-\d{2}$/.test(url)) {
        return jsonResponse([
          { id: 41, courtId: 10, date: '2026-07-20', startTime: '10:00:00', endTime: '11:00:00', status: 'CONFIRMADA' },
          {
            id: 42,
            courtId: 10,
            date: '2026-07-20',
            startTime: '11:00:00',
            endTime: '12:00:00',
            status: 'PENDENTE',
            client: { name: 'Pessoa secreta', email: 'segredo@teste.com' },
            totalValue: 999,
            notes: 'Informacao privada'
          },
          { id: 43, courtId: 10, date: '2026-07-20', startTime: '12:00:00', endTime: '13:00:00', status: 'CANCELADA' }
        ]);
      }

      if (url.endsWith('/payments/my') || url.endsWith('/notifications')) return jsonResponse([]);
      throw new Error(`Rota inesperada no teste: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await fetchCoreData('token-cliente', 'CLIENTE');

    expect(data.reservations).toHaveLength(2);
    expect(data.reservations[0]).toMatchObject({ id: '41', code: 'RES-0041', clientId: '7' });
    expect(data.reservations[1]).toMatchObject({
      id: 'occupied-42',
      code: 'Horário ocupado',
      clientId: 'private-occupied-slot',
      clientName: 'Reservado',
      courtId: '10',
      courtName: 'Quadra Central',
      modality: 'Tênis',
      players: 0,
      totalValue: 0,
      notes: undefined,
      history: ['Horário indisponível']
    });
    expect(JSON.stringify(data.reservations)).not.toContain('Pessoa secreta');
    expect(JSON.stringify(data.reservations)).not.toContain('segredo@teste.com');
    expect(JSON.stringify(data.reservations)).not.toContain('Informacao privada');
  });

  it('consulta exatamente o novo intervalo solicitado pela navegação', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAvailabilityRangeWithApi('2027-01-04', '2027-01-10', 'token-cliente')).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0]).endsWith('/reservations/availability?start=2027-01-04&end=2027-01-10')).toBe(true);
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe('Bearer token-cliente');
  });
});

describe('integracao dos modulos API-first', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mapeia comunidade, conquistas, avaliacoes, ranking e configuracoes do backend', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/courts') || url.endsWith('/reservations') || url.endsWith('/payments') || url.endsWith('/notifications') || url.endsWith('/users')) {
        return jsonResponse([]);
      }
      if (url.endsWith('/community/feed')) return jsonResponse([{
        id: 1,
        authorId: 9,
        authorName: 'Ana',
        avatarUrl: 'https://cdn.test/ana.jpg',
        content: 'venceu uma partida.',
        type: 'Conquista',
        likes: 7,
        comments: 2,
        createdAt: '2026-07-12T10:00:00Z'
      }]);
      if (url.endsWith('/community/partners')) return jsonResponse([{
        id: 2,
        playerId: 9,
        playerName: 'Ana',
        avatarUrl: 'https://cdn.test/ana.jpg',
        modality: 'FUTEVOLEI',
        level: 'Avançado',
        city: 'Santos',
        availability: 'Sábados',
        notes: 'Treino competitivo',
        createdAt: '2026-07-12T10:00:00Z'
      }]);
      if (url.endsWith('/community/championships')) return jsonResponse([{
        id: 3,
        name: 'Open',
        modality: 'TENIS',
        startDate: '2026-08-01',
        categories: 'Duplas',
        prize: 'Troféu',
        status: 'Inscricoes abertas',
        regulation: 'Mata-mata',
        bracket: ['Quartas', 'Final'],
        createdAt: '2026-07-12T10:00:00Z'
      }]);
      if (url.endsWith('/community/achievements/my')) return jsonResponse([{
        id: 4,
        icon: 'Medal',
        title: 'Primeira reserva',
        description: 'Reserve uma quadra',
        progress: 1,
        targetValue: 1,
        percentComplete: 100,
        unlockedAt: '2026-07-01',
        createdAt: '2026-07-01T10:00:00Z'
      }]);
      if (url.endsWith('/community/reviews')) return jsonResponse([{
        id: 5,
        userName: 'Ana',
        avatarUrl: 'https://cdn.test/ana.jpg',
        courtName: 'Central',
        ratings: { cleaning: 5, lighting: 4, organization: 5, service: 4, courtQuality: 5 },
        average: 4.6,
        comment: 'Excelente',
        createdAt: '2026-07-12T10:00:00Z'
      }]);
      if (url.endsWith('/community/ranking')) return jsonResponse([{
        id: 9,
        name: 'Ana',
        city: 'Santos',
        favoriteModality: 'FUTEVOLEI',
        reservations: 12,
        hours: 18.5,
        attendanceRate: 96
      }]);
      if (url.endsWith('/settings')) return jsonResponse({
        company: 'PlaySpace Club',
        hours: '08:00 - 22:00',
        cancelationRuleHours: 2,
        minimumReservationMinutes: 60,
        modalities: ['Beach Tennis', 'Futevolei', 'Society', 'Tenis', 'Volei', 'Basquete'],
        defaultPrices: { 'Beach Tennis': 120, Futevolei: 110, Society: 180, Tenis: 115, Volei: 95, Basquete: 90 }
      });
      if (url.endsWith('/dashboard/admin')) return jsonResponse({
        activity: [{ id: 91, actor: 'Operador real', action: 'Atualizou uma quadra', category: 'QUADRA', createdAt: '2026-07-12T11:00:00Z' }]
      });
      throw new Error(`Rota inesperada no teste: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await fetchCoreData('token-admin', 'ADMIN');

    expect(data.posts?.[0]).toMatchObject({ id: '1', authorId: '9', avatarUrl: 'https://cdn.test/ana.jpg', likes: 7 });
    expect(data.partnerAds?.[0]).toMatchObject({ id: '2', playerId: '9', modality: 'Futevôlei' });
    expect(data.championships?.[0]).toMatchObject({ id: '3', modality: 'Tênis', bracket: ['Quartas', 'Final'] });
    expect(data.achievements?.[0]).toMatchObject({ id: '4', target: 1, percent: 100 });
    expect(data.reviews?.[0]).toMatchObject({ cleaning: 5, courtQuality: 5, average: 4.6 });
    expect(data.ranking?.[0]).toMatchObject({ id: '9', favoriteModality: 'Futevôlei', hours: 18.5 });
    expect(data.settings).toMatchObject({
      modalities: ['Beach Tennis', 'Futevôlei', 'Society', 'Tênis', 'Vôlei', 'Basquete'],
      defaultPrices: { 'Futevôlei': 110, 'Tênis': 115, 'Vôlei': 95 }
    });
    expect(data.activities).toEqual([{
      id: '91',
      actor: 'Operador real',
      action: 'Atualizou uma quadra',
      category: 'QUADRA',
      createdAt: '2026-07-12T11:00:00Z'
    }]);
  });

  it('usa as respostas do servidor para curtir, inscrever e consultar o assistente', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/community/feed/11/like')) return jsonResponse({
        id: 11,
        authorId: 9,
        authorName: 'Ana',
        content: 'jogou hoje.',
        type: 'Reserva',
        likes: 21,
        comments: 3,
        createdAt: '2026-07-12T10:00:00Z'
      });
      if (url.endsWith('/community/championships/3/enroll')) return jsonResponse({ message: 'Ana inscrita no Open (demo).' });
      if (url.endsWith('/ai/ask')) return jsonResponse({ assistant: 'PlaySpace AI', answer: 'Seu melhor horário é 19:00.' });
      throw new Error(`Rota inesperada no teste: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(likePostWithApi('11', 'token-cliente')).resolves.toMatchObject({ id: '11', likes: 21 });
    await expect(enrollInChampionshipWithApi('3', 'token-cliente')).resolves.toBe('Ana inscrita no Open (demo).');
    await expect(askAiWithApi('Qual meu melhor horário?', 'token-cliente')).resolves.toBe('Seu melhor horário é 19:00.');

    const requests = fetchMock.mock.calls.map(([input, init]) => ({ url: String(input), init: init ?? {} }));
    expect(requests).toHaveLength(3);
    expect(requests.every(({ init }) => init.headers && (init.headers as Record<string, string>).Authorization === 'Bearer token-cliente')).toBe(true);
    expect(requests[2].init.body).toBe(JSON.stringify({ question: 'Qual meu melhor horario?' }));
  });
});
