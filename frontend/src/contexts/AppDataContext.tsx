import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { demoCredentials, initialState } from '../lib/demoData';
import {
  archiveCourtWithApi,
  cancelReservationWithApi,
  clearNotificationsWithApi,
  createReservationWithApi,
  deactivateUserWithApi,
  enrollInChampionshipWithApi,
  fetchAvailabilityRangeWithApi,
  fetchCoreData,
  askAiWithApi,
  likePostWithApi,
  markNotificationWithApi,
  mergeClientAvailability,
  payReservationWithApi,
  saveCourtWithApi,
  saveUserWithApi,
  tokenFromStorage
} from '../lib/api';
import type { AvailabilityRange } from '../lib/api';
import type {
  Court,
  NotificationItem,
  PartnerAd,
  Payment,
  PaymentMethod,
  PlaySpaceState,
  Reservation,
  ReservationFormInput,
  Settings,
  User
} from '../lib/types';

interface AppDataContextValue {
  state: PlaySpaceState;
  demoCredentials: typeof demoCredentials;
  dataSource: 'api' | 'demo';
  isSyncing: boolean;
  connectionError: string;
  hydrateFromApi: (token: string, actor: User) => Promise<void>;
  ensureAvailabilityRange: (start: string, end: string) => Promise<void>;
  resetSessionData: () => void;
  createReservation: (input: ReservationFormInput, actor: User) => Promise<Reservation>;
  cancelReservation: (reservationId: string, actor: User) => Promise<Reservation>;
  payReservation: (reservationId: string, method: PaymentMethod, approve?: boolean) => Promise<Payment>;
  saveCourt: (court: Court) => Promise<Court>;
  removeCourt: (courtId: string) => Promise<void>;
  saveUser: (user: User) => Promise<User>;
  toggleUserActive: (userId: string) => Promise<void>;
  markNotificationRead: (notificationId: string, userId: string) => void;
  clearNotifications: (userId: string) => void;
  likePost: (postId: string) => Promise<void>;
  commentPost: (postId: string) => void;
  addPartnerAd: (ad: Omit<PartnerAd, 'id'>) => PartnerAd;
  enrollInChampionship: (championshipId: string) => Promise<string>;
  toggleFavoriteCourt: (courtId: string) => void;
  toggleTheme: () => void;
  saveSettings: (settings: Settings) => void;
  finishTour: () => void;
  askAi: (question: string, user: User) => Promise<string>;
  resetDemo: () => void;
}

const STORAGE_KEY = 'playspace-state-v1';
const AppDataContext = createContext<AppDataContextValue | null>(null);

const cloneInitialState = (): PlaySpaceState => JSON.parse(JSON.stringify(initialState));

type SafeLocalPreferences = Pick<PlaySpaceState['preferences'], 'theme' | 'tourDone'>;

const readSafePreferences = (value: unknown): Partial<SafeLocalPreferences> => {
  if (!value || typeof value !== 'object') return {};
  const preferences = (value as { preferences?: unknown }).preferences;
  if (!preferences || typeof preferences !== 'object') return {};
  const candidate = preferences as Partial<SafeLocalPreferences>;
  return {
    ...(candidate.theme === 'dark' || candidate.theme === 'light' ? { theme: candidate.theme } : {}),
    ...(typeof candidate.tourDone === 'boolean' ? { tourDone: candidate.tourDone } : {})
  };
};

const createSessionBaseline = (safePreferences: Partial<SafeLocalPreferences> = {}): PlaySpaceState => {
  const fresh = cloneInitialState();
  fresh.preferences = { ...fresh.preferences, ...safePreferences };
  return fresh;
};

const loadState = (): PlaySpaceState => {
  const systemTheme = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return createSessionBaseline(readSafePreferences(JSON.parse(stored)));
    return createSessionBaseline({ theme: systemTheme });
  } catch {
    return createSessionBaseline({ theme: systemTheme });
  }
};

const nowIso = () => new Date().toISOString();
const toDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);
const activeStatuses = ['Pendente', 'Confirmada', 'Em andamento'];

const minutesBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

export function AppDataProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PlaySpaceState>(() => loadState());
  const [dataSource, setDataSource] = useState<'api' | 'demo'>('demo');
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const sessionGeneration = useRef(0);
  const availabilityCoverage = useRef<AvailabilityRange[]>([]);
  const availabilityRequests = useRef(new Map<string, Promise<void>>());

  useEffect(() => {
    // Dados vindos da API nunca são persistidos. Somente preferências visuais
    // não identificáveis sobrevivem à expiração, logout ou troca de conta.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      preferences: {
        theme: state.preferences.theme,
        tourDone: state.preferences.tourDone
      }
    }));
    document.documentElement.dataset.theme = state.preferences.theme;
  }, [state]);

  const pushNotification = (draft: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>, userId: string) => {
    const notification: NotificationItem = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: nowIso(),
      read: false
    };
    return notification;
  };

  const resetSessionData = useCallback(() => {
    sessionGeneration.current += 1;
    availabilityCoverage.current = [];
    availabilityRequests.current.clear();
    setIsSyncing(false);
    setConnectionError('');
    setDataSource('demo');
    setState((current) => createSessionBaseline({
      theme: current.preferences.theme,
      tourDone: current.preferences.tourDone
    }));
  }, []);

  const hydrateFromApi = useCallback(async (token: string, actor: User) => {
    const generation = ++sessionGeneration.current;
    setIsSyncing(true);
    setConnectionError('');
    try {
      const remote = await fetchCoreData(token, actor.role);
      if (generation !== sessionGeneration.current) return;
      availabilityCoverage.current = remote.availabilityRange ? [remote.availabilityRange] : [];
      setState((current) => ({
        ...current,
        courts: remote.courts,
        reservations: remote.reservations,
        payments: remote.payments,
        users: actor.role === 'ADMIN'
          ? remote.users
          : [actor],
        notifications: {
          ...current.notifications,
          [actor.id]: remote.notifications
        },
        activities: remote.activities ?? [],
        ...(remote.posts !== undefined ? { posts: remote.posts } : {}),
        ...(remote.partnerAds !== undefined ? { partnerAds: remote.partnerAds } : {}),
        ...(remote.championships !== undefined ? { championships: remote.championships } : {}),
        ...(remote.achievements !== undefined
          ? { achievements: { ...current.achievements, [actor.id]: remote.achievements } }
          : {}),
        ...(remote.reviews !== undefined ? { reviews: remote.reviews } : {}),
        ...(remote.ranking !== undefined ? { ranking: remote.ranking } : {}),
        ...(remote.settings !== undefined ? { settings: remote.settings } : {})
      }));
      setDataSource('api');
    } catch (error) {
      if (generation !== sessionGeneration.current) return;
      setDataSource('demo');
      setConnectionError(error instanceof Error ? error.message : 'API indisponível; modo demonstração local ativado.');
    } finally {
      if (generation === sessionGeneration.current) setIsSyncing(false);
    }
  }, []);

  const ensureAvailabilityRange = useCallback(async (start: string, end: string) => {
    if (dataSource !== 'api') return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start > end) {
      throw new Error('Período de disponibilidade inválido.');
    }
    if (availabilityCoverage.current.some((range) => range.start <= start && range.end >= end)) return;

    const token = tokenFromStorage();
    if (!token) throw new Error('Sua sessão expirou. Entre novamente para consultar a agenda.');

    const requestKey = `${start}:${end}`;
    const pending = availabilityRequests.current.get(requestKey);
    if (pending) return pending;

    const generation = sessionGeneration.current;
    const load = (async () => {
      const availability = await fetchAvailabilityRangeWithApi(start, end, token);
      if (generation !== sessionGeneration.current) return;

      setState((current) => {
        const ownReservations = current.reservations.filter((reservation) => reservation.clientId !== 'private-occupied-slot');
        const occupiedSlots = mergeClientAvailability(ownReservations, availability, current.courts)
          .filter((reservation) => reservation.clientId === 'private-occupied-slot');
        const reservationsOutsideRange = current.reservations.filter((reservation) =>
          reservation.clientId !== 'private-occupied-slot'
          || reservation.date < start
          || reservation.date > end
        );
        return {
          ...current,
          reservations: [...reservationsOutsideRange, ...occupiedSlots]
        };
      });
      availabilityCoverage.current = [...availabilityCoverage.current, { start, end }];
    })().finally(() => {
      availabilityRequests.current.delete(requestKey);
    });

    availabilityRequests.current.set(requestKey, load);
    return load;
  }, [dataSource]);

  const value = useMemo<AppDataContextValue>(() => {
    const createReservation = async (input: ReservationFormInput, actor: User) => {
      const token = tokenFromStorage();
      if (dataSource === 'api' && token) {
        const generation = sessionGeneration.current;
        const reservation = await createReservationWithApi(input, token);
        if (generation !== sessionGeneration.current) return reservation;
        setState((current) => ({
          ...current,
          reservations: [reservation, ...current.reservations.filter((item) => item.id !== reservation.id)],
          activities: [
            { id: crypto.randomUUID(), actor: actor.name, action: `Criou a reserva ${reservation.code}`, category: 'Reserva', createdAt: nowIso() },
            ...current.activities
          ]
        }));
        return reservation;
      }

      const court = state.courts.find((item) => item.id === input.courtId);
      if (!court) throw new Error('Quadra não encontrada.');
      if (court.status !== 'Disponível') throw new Error('A quadra selecionada não está disponível para reservas.');
      if (toDateTime(input.date, input.startTime).getTime() < Date.now()) throw new Error('Não é permitido reservar horários no passado.');
      if (minutesBetween(input.startTime, input.endTime) <= 0) throw new Error('Horário final deve ser maior que o inicial.');
      if (input.startTime < '08:00' || input.endTime > '22:00') throw new Error('Reservas permitidas apenas entre 08:00 e 22:00.');

      const hasConflict = state.reservations.some((reservation) => {
        if (reservation.courtId !== court.id || reservation.date !== input.date || !activeStatuses.includes(reservation.status)) return false;
        return input.startTime < reservation.endTime && input.endTime > reservation.startTime;
      });
      if (hasConflict) throw new Error('Já existe uma reserva nesse horário para a quadra selecionada.');

      const client = actor.role === 'CLIENTE' ? actor : state.users.find((user) => user.id === input.clientId) ?? actor;
      const totalValue = (court.pricePerHour * minutesBetween(input.startTime, input.endTime)) / 60;
      const reservation: Reservation = {
        id: crypto.randomUUID(),
        code: `PS-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: client.id,
        clientName: client.name,
        courtId: court.id,
        courtName: court.name,
        modality: court.modality,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        players: input.players,
        totalValue,
        status: 'Pendente',
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        history: [`Reserva criada por ${actor.name}`]
      };

      setState((current) => ({
        ...current,
        reservations: [reservation, ...current.reservations],
        activities: [
          { id: crypto.randomUUID(), actor: actor.name, action: `Criou a reserva ${reservation.code}`, category: 'Reserva', createdAt: nowIso() },
          ...current.activities
        ],
        notifications: {
          ...current.notifications,
          [client.id]: [
            pushNotification({ title: 'Nova reserva criada', message: `${reservation.code} aguardando pagamento.`, type: 'Reserva' }, client.id),
            ...(current.notifications[client.id] ?? [])
          ],
          'u-admin': [
            pushNotification({ title: 'Nova reserva criada', message: `${client.name} reservou ${court.name}.`, type: 'Reserva' }, 'u-admin'),
            ...(current.notifications['u-admin'] ?? [])
          ]
        }
      }));

      return reservation;
    };

    const cancelReservation = async (reservationId: string, actor: User) => {
      const reservation = state.reservations.find((item) => item.id === reservationId);
      if (!reservation) throw new Error('Reserva não encontrada.');
      const token = tokenFromStorage();
      if (dataSource === 'api' && token) {
        const generation = sessionGeneration.current;
        const updated = await cancelReservationWithApi(reservationId, token);
        if (generation !== sessionGeneration.current) return updated;
        setState((current) => ({
          ...current,
          reservations: current.reservations.map((item) => (item.id === reservationId ? updated : item)),
          payments: current.payments.map((item) => (item.reservationId === reservationId ? { ...item, status: 'Cancelado' } : item)),
          activities: [{ id: crypto.randomUUID(), actor: actor.name, action: `Cancelou ${reservation.code}`, category: 'Cancelamento', createdAt: nowIso() }, ...current.activities]
        }));
        return updated;
      }
      if (actor.role === 'CLIENTE' && reservation.clientId !== actor.id) throw new Error('Você só pode cancelar suas próprias reservas.');
      if (reservation.status === 'Concluída') throw new Error('Reservas concluídas não podem ser canceladas.');
      if (actor.role === 'CLIENTE' && toDateTime(reservation.date, reservation.startTime).getTime() - Date.now() < state.settings.cancelationRuleHours * 60 * 60 * 1000) {
        throw new Error(`Cancelamento permitido até ${state.settings.cancelationRuleHours} horas antes do horário.`);
      }
      const updated = { ...reservation, status: 'Cancelada' as const, history: [...reservation.history, `Cancelada por ${actor.name}`] };
      setState((current) => ({
        ...current,
        reservations: current.reservations.map((item) => (item.id === reservationId ? updated : item)),
        payments: current.payments.map((item) => (item.reservationId === reservationId ? { ...item, status: 'Cancelado' } : item)),
        activities: [{ id: crypto.randomUUID(), actor: actor.name, action: `Cancelou ${reservation.code}`, category: 'Cancelamento', createdAt: nowIso() }, ...current.activities]
      }));
      return updated;
    };

    const payReservation = async (reservationId: string, method: PaymentMethod, approve = true) => {
      const reservation = state.reservations.find((item) => item.id === reservationId);
      if (!reservation) throw new Error('Reserva não encontrada.');
      const token = tokenFromStorage();
      if (dataSource === 'api' && token) {
        if (!approve) throw new Error('Recusas de pagamento não são disparadas pelo cliente.');
        const generation = sessionGeneration.current;
        const payment = await payReservationWithApi(reservationId, method, token);
        if (generation !== sessionGeneration.current) return payment;
        setState((current) => ({
          ...current,
          reservations: current.reservations.map((item) =>
            item.id === reservationId
              ? { ...item, status: payment.status === 'Aprovado' ? 'Confirmada' : item.status, paymentMethod: method, history: [...item.history, `Pagamento ${payment.status.toLowerCase()}`] }
              : item
          ),
          payments: [payment, ...current.payments.filter((item) => item.id !== payment.id)]
        }));
        return payment;
      }
      const payment: Payment = {
        id: crypto.randomUUID(),
        reservationId,
        reservationCode: reservation.code,
        method,
        status: approve ? 'Aprovado' : 'Recusado',
        amount: reservation.totalValue,
        transactionCode: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
        paidAt: approve ? nowIso() : undefined
      };
      setState((current) => ({
        ...current,
        reservations: current.reservations.map((item) =>
          item.id === reservationId
            ? { ...item, status: approve ? 'Confirmada' : item.status, paymentMethod: method, history: [...item.history, approve ? 'Pagamento aprovado' : 'Pagamento recusado'] }
            : item
        ),
        payments: [payment, ...current.payments],
        notifications: {
          ...current.notifications,
          [reservation.clientId]: [
            pushNotification(
              {
                title: approve ? 'Pagamento aprovado' : 'Pagamento recusado',
                message: approve ? `${reservation.code} confirmada com sucesso.` : `Tente outro método para ${reservation.code}.`,
                type: 'Pagamento'
              },
              reservation.clientId
            ),
            ...(current.notifications[reservation.clientId] ?? [])
          ]
        },
        activities: [
          { id: crypto.randomUUID(), actor: reservation.clientName, action: `${approve ? 'aprovou' : 'tentou'} pagamento ${method}`, category: 'Pagamento', createdAt: nowIso() },
          ...current.activities
        ]
      }));
      return payment;
    };

    return {
      state,
      demoCredentials,
      dataSource,
      isSyncing,
      connectionError,
      hydrateFromApi,
      ensureAvailabilityRange,
      resetSessionData,
      createReservation,
      cancelReservation,
      payReservation,
      saveCourt: async (court) => {
        const token = tokenFromStorage();
        const generation = sessionGeneration.current;
        const saved = dataSource === 'api' && token
          ? await saveCourtWithApi(court, token)
          : court.id
            ? court
            : { ...court, id: crypto.randomUUID() };
        if (generation !== sessionGeneration.current) return saved;
        setState((current) => ({
          ...current,
          courts: current.courts.some((item) => item.id === saved.id)
            ? current.courts.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current.courts]
        }));
        return saved;
      },
      removeCourt: async (courtId) => {
        const court = state.courts.find((item) => item.id === courtId);
        if (!court) throw new Error('Quadra não encontrada.');
        const token = tokenFromStorage();
        const generation = sessionGeneration.current;
        const archived = dataSource === 'api' && token
          ? await archiveCourtWithApi(court, token)
          : { ...court, status: 'Indisponível' as const };
        if (generation !== sessionGeneration.current) return;
        setState((current) => ({
          ...current,
          courts: current.courts.map((item) => (item.id === courtId ? archived : item))
        }));
      },
      saveUser: async (user) => {
        const duplicate = state.users.find((item) => item.id !== user.id && item.email.toLowerCase() === user.email.toLowerCase());
        if (duplicate) throw new Error('Já existe um usuário com este e-mail.');
        const token = tokenFromStorage();
        const generation = sessionGeneration.current;
        const saved = dataSource === 'api' && token
          ? await saveUserWithApi(user, token)
          : user.id
            ? user
            : { ...user, id: crypto.randomUUID() };
        if (generation !== sessionGeneration.current) return saved;
        setState((current) => ({
          ...current,
          users: current.users.some((item) => item.id === saved.id)
            ? current.users.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current.users]
        }));
        return saved;
      },
      toggleUserActive: async (userId) => {
        const target = state.users.find((user) => user.id === userId);
        if (!target) throw new Error('Usuário não encontrado.');
        if (target.role === 'ADMIN' && target.active && state.users.filter((user) => user.role === 'ADMIN' && user.active).length <= 1) {
          throw new Error('Não é possível inativar o último administrador ativo.');
        }
        const token = tokenFromStorage();
        const generation = sessionGeneration.current;
        if (dataSource === 'api' && token) {
          if (target.active) await deactivateUserWithApi(userId, token);
          else await saveUserWithApi({ ...target, active: true }, token);
        }
        if (generation !== sessionGeneration.current) return;
        setState((current) => ({
          ...current,
          users: current.users.map((user) => (user.id === userId ? { ...user, active: !user.active } : user))
        }));
      },
      markNotificationRead: (notificationId, userId) =>
        {
          const token = tokenFromStorage();
          if (dataSource === 'api' && token) markNotificationWithApi(notificationId, token).catch((error) => setConnectionError(error.message));
          setState((current) => ({
            ...current,
            notifications: {
              ...current.notifications,
              [userId]: (current.notifications[userId] ?? []).map((item) => (item.id === notificationId ? { ...item, read: true } : item))
            }
          }));
        },
      clearNotifications: (userId) =>
        {
          const token = tokenFromStorage();
          if (dataSource === 'api' && token) clearNotificationsWithApi(token).catch((error) => setConnectionError(error.message));
          setState((current) => ({
            ...current,
            notifications: { ...current.notifications, [userId]: [] }
          }));
        },
      likePost: async (postId) => {
          const token = tokenFromStorage();
          if (dataSource === 'api' && token && /^\d+$/.test(postId)) {
            const generation = sessionGeneration.current;
            try {
              const updated = await likePostWithApi(postId, token);
              if (generation !== sessionGeneration.current) return;
              setState((current) => ({
                ...current,
                posts: current.posts.map((post) => (post.id === postId ? updated : post))
              }));
            } catch (error) {
              if (generation === sessionGeneration.current) {
                setConnectionError(error instanceof Error ? error.message : 'Não foi possível curtir a publicação.');
              }
            }
            return;
          }
          setState((current) => ({
            ...current,
            posts: current.posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post))
          }));
      },
      commentPost: (postId) => setState((current) => ({
        ...current,
        posts: current.posts.map((post) => (post.id === postId ? { ...post, comments: post.comments + 1 } : post))
      })),
      addPartnerAd: (ad) => {
        const saved = { ...ad, id: crypto.randomUUID() };
        setState((current) => ({ ...current, partnerAds: [saved, ...current.partnerAds] }));
        return saved;
      },
      enrollInChampionship: async (championshipId) => {
        const token = tokenFromStorage();
        if (dataSource === 'api' && token && /^\d+$/.test(championshipId)) {
          return enrollInChampionshipWithApi(championshipId, token);
        }
        const championship = state.championships.find((item) => item.id === championshipId);
        if (!championship) throw new Error('Campeonato não encontrado.');
        return `Inscrição demonstrativa confirmada em ${championship.name}.`;
      },
      toggleFavoriteCourt: (courtId) =>
        setState((current) => {
          const exists = current.preferences.favoriteCourts.includes(courtId);
          return {
            ...current,
            preferences: {
              ...current.preferences,
              favoriteCourts: exists ? current.preferences.favoriteCourts.filter((id) => id !== courtId) : [...current.preferences.favoriteCourts, courtId]
            }
          };
        }),
      toggleTheme: () =>
        setState((current) => ({
          ...current,
          preferences: { ...current.preferences, theme: current.preferences.theme === 'dark' ? 'light' : 'dark' }
        })),
      saveSettings: (settings) => setState((current) => ({ ...current, settings })),
      finishTour: () => setState((current) => ({ ...current, preferences: { ...current.preferences, tourDone: true } })),
      askAi: async (question, user) => {
        const token = tokenFromStorage();
        if (dataSource === 'api' && token) return askAiWithApi(question, token);
        const normalized = question.toLowerCase();
        const myReservations = state.reservations.filter((reservation) => reservation.clientId === user.id);
        if (normalized.includes('gastei') || normalized.includes('gasto')) return 'Neste mês, seu gasto estimado é R$ 540,00. No ano, você está em R$ 4.380,00.';
        if (normalized.includes('horário') || normalized.includes('horario')) return 'Seu melhor horário para jogar é 19:00, com maior frequência e comparecimento.';
        if (normalized.includes('modalidade')) return `Sua modalidade mais praticada é ${user.profile.favoriteModality}.`;
        if (normalized.includes('quadra')) return 'A quadra que você mais utiliza é a Quadra Aurora.';
        if (normalized.includes('última') || normalized.includes('ultima')) return myReservations[0] ? `Sua última reserva foi ${myReservations[0].code} em ${myReservations[0].courtName}.` : 'Você ainda não tem reservas.';
        return `Analisei seus dados: você tem ${user.profile.hoursOnCourt} horas em quadra, ${user.profile.attendanceRate}% de comparecimento e uma sequência ativa de 6 jogos.`;
      },
      resetDemo: () => {
        resetSessionData();
      }
    };
  }, [connectionError, dataSource, ensureAvailabilityRange, hydrateFromApi, isSyncing, resetSessionData, state]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData deve ser usado dentro de AppDataProvider.');
  return context;
}
