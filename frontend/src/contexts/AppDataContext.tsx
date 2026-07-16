import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { demoCredentials, initialState } from '../lib/demoData';
import {
  archiveCourtWithApi,
  cancelChampionshipEnrollmentWithApi,
  cancelPartnerInterestWithApi,
  cancelReservationWithApi,
  changeChampionshipStatusWithApi,
  changeReservationStatusWithApi,
  changePasswordWithApi,
  clearNotificationsWithApi,
  createCommunityCommentWithApi,
  createCommunityPostWithApi,
  createReviewWithApi,
  createReservationWithApi,
  deleteChampionshipWithApi,
  deleteCommunityCommentWithApi,
  deleteCommunityPostWithApi,
  deactivateUserWithApi,
  enrollChampionshipWithApi,
  enrollInChampionshipWithApi,
  fetchAvailabilityRangeWithApi,
  fetchCoreData,
  fetchCommunityCommentsWithApi,
  fetchChampionshipParticipantsWithApi,
  askAiWithApi,
  likePostWithApi,
  markNotificationWithApi,
  mergeClientAvailability,
  payReservationWithApi,
  refundPaymentWithApi,
  removeProfileAvatarWithApi,
  respondPartnerInterestWithApi,
  saveCourtWithApi,
  saveChampionshipWithApi,
  savePreferencesWithApi,
  saveProfileWithApi,
  saveSettingsWithApi,
  saveSportsProfileWithApi,
  sendPartnerInterestWithApi,
  toggleCommunityLikeWithApi,
  updateCommunityCommentWithApi,
  updateCommunityPostWithApi,
  saveUserWithApi,
  tokenFromStorage
} from '../lib/api';
import type { AvailabilityRange } from '../lib/api';
import type {
  Championship,
  ChampionshipEnrollment,
  CommunityComment,
  CommunityPost,
  Court,
  NotificationItem,
  PartnerAd,
  Payment,
  PaymentMethod,
  PartnerInterest,
  PlaySpaceState,
  Reservation,
  ReservationFormInput,
  Review,
  Settings,
  SportsProfile,
  User,
  UserPreferences
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
  changeReservationStatus: (reservationId: string, status: Reservation['status'], actor: User) => Promise<Reservation>;
  payReservation: (reservationId: string, method: PaymentMethod, approve?: boolean) => Promise<Payment>;
  refundPayment: (paymentId: string, actor: User) => Promise<Payment>;
  saveCourt: (court: Court) => Promise<Court>;
  removeCourt: (courtId: string) => Promise<void>;
  saveUser: (user: User) => Promise<User>;
  toggleUserActive: (userId: string) => Promise<void>;
  markNotificationRead: (notificationId: string, userId: string) => void;
  clearNotifications: (userId: string) => void;
  likePost: (postId: string, userId?: string) => Promise<void>;
  commentPost: (postId: string) => void;
  saveCommunityPost: (draft: Pick<CommunityPost, 'content' | 'type' | 'modality'> & { id?: string }, actor: User) => Promise<CommunityPost>;
  removeCommunityPost: (postId: string, actor: User) => Promise<void>;
  loadCommunityComments: (postId: string) => Promise<CommunityComment[]>;
  saveCommunityComment: (postId: string, content: string, actor: User, commentId?: string) => Promise<CommunityComment>;
  removeCommunityComment: (postId: string, commentId: string, actor: User) => Promise<void>;
  addPartnerAd: (ad: Omit<PartnerAd, 'id'>) => PartnerAd;
  saveSportsProfile: (profile: SportsProfile) => Promise<SportsProfile>;
  sendPartnerInterest: (receiverId: string, message: string, actor: User) => Promise<PartnerInterest>;
  respondPartnerInterest: (interestId: string, accept: boolean, actor: User) => Promise<PartnerInterest>;
  cancelPartnerInterest: (interestId: string, actor: User) => Promise<void>;
  enrollInChampionship: (championshipId: string) => Promise<string>;
  saveChampionship: (championship: Championship, actor: User) => Promise<Championship>;
  changeChampionshipStatus: (championshipId: string, status: string, actor: User) => Promise<Championship>;
  removeChampionship: (championshipId: string, actor: User) => Promise<void>;
  registerChampionship: (championshipId: string, actor: User) => Promise<ChampionshipEnrollment>;
  cancelChampionshipEnrollment: (championshipId: string, actor: User) => Promise<void>;
  loadChampionshipParticipants: (championshipId: string) => Promise<ChampionshipEnrollment[]>;
  saveCurrentProfile: (user: User) => Promise<User>;
  removeCurrentAvatar: (user: User) => Promise<User>;
  changeCurrentPassword: (user: User, currentPassword: string, newPassword: string, confirmation: string) => Promise<void>;
  saveUserPreferences: (userId: string, preferences: UserPreferences) => Promise<UserPreferences>;
  submitReview: (reservationId: string, ratings: Pick<Review, 'cleaning' | 'lighting' | 'organization' | 'service' | 'courtQuality'>, comment: string, actor: User) => Promise<Review>;
  registerDemoUser: (input: { name: string; email: string; password: string; phone?: string }) => User;
  toggleFavoriteCourt: (courtId: string) => void;
  toggleTheme: () => void;
  saveSettings: (settings: Settings) => Promise<Settings>;
  finishTour: () => void;
  askAi: (question: string, user: User) => Promise<string>;
  resetDemo: () => void;
}

const STORAGE_KEY = 'playspace-state-v1';
const DEMO_STORAGE_KEY = 'playspace-demo-state-v3';
const DEMO_PASSWORDS_KEY = 'playspace-demo-passwords-v1';
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

const mergeStoredDemoState = (value: unknown, safePreferences: Partial<SafeLocalPreferences>): PlaySpaceState => {
  const fresh = createSessionBaseline(safePreferences);
  if (!value || typeof value !== 'object') return fresh;
  const envelope = value as { state?: unknown; version?: number };
  const candidate = (envelope.state ?? value) as Partial<PlaySpaceState>;
  if (!candidate || typeof candidate !== 'object') return fresh;
  return {
    ...fresh,
    ...candidate,
    users: Array.isArray(candidate.users) ? candidate.users : fresh.users,
    courts: Array.isArray(candidate.courts) ? candidate.courts : fresh.courts,
    reservations: Array.isArray(candidate.reservations) ? candidate.reservations : fresh.reservations,
    payments: Array.isArray(candidate.payments) ? candidate.payments : fresh.payments,
    posts: Array.isArray(candidate.posts) ? candidate.posts : fresh.posts,
    sportsProfiles: Array.isArray(candidate.sportsProfiles) ? candidate.sportsProfiles : fresh.sportsProfiles,
    partnerInterests: Array.isArray(candidate.partnerInterests) ? candidate.partnerInterests : fresh.partnerInterests,
    championships: Array.isArray(candidate.championships) ? candidate.championships : fresh.championships,
    championshipEnrollments: Array.isArray(candidate.championshipEnrollments)
      ? candidate.championshipEnrollments
      : fresh.championshipEnrollments,
    settings: { ...fresh.settings, ...(candidate.settings ?? {}) },
    userPreferences: { ...fresh.userPreferences, ...(candidate.userPreferences ?? {}) },
    preferences: { ...fresh.preferences, ...(candidate.preferences ?? {}), ...safePreferences }
  };
};

const loadState = (): PlaySpaceState => {
  const systemTheme = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const safePreferences = stored ? readSafePreferences(JSON.parse(stored)) : { theme: systemTheme as 'dark' | 'light' };
    const demoStored = localStorage.getItem(DEMO_STORAGE_KEY);
    return demoStored ? mergeStoredDemoState(JSON.parse(demoStored), safePreferences) : createSessionBaseline(safePreferences);
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 2,
        preferences: {
          theme: state.preferences.theme,
          tourDone: state.preferences.tourDone
        }
      }));
    } catch {
      // A interface continua utilizável quando o navegador bloqueia armazenamento.
    }
    document.documentElement.dataset.theme = state.preferences.theme;
  }, [state.preferences.theme, state.preferences.tourDone]);

  useEffect(() => {
    if (dataSource !== 'demo') return undefined;
    // Consolida alterações próximas para evitar serializações grandes em sequência.
    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ version: 3, state }));
      } catch {
        // O estado em memória segue funcional mesmo sem persistência disponível.
      }
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [dataSource, state]);

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
    setState((current) => {
      try {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        return stored
          ? mergeStoredDemoState(JSON.parse(stored), { theme: current.preferences.theme, tourDone: current.preferences.tourDone })
          : createSessionBaseline({ theme: current.preferences.theme, tourDone: current.preferences.tourDone });
      } catch {
        return createSessionBaseline({ theme: current.preferences.theme, tourDone: current.preferences.tourDone });
      }
    });
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
        ...(remote.sportsProfiles !== undefined ? { sportsProfiles: remote.sportsProfiles } : {}),
        ...(remote.partnerInterests !== undefined ? { partnerInterests: remote.partnerInterests } : {}),
        ...(remote.championships !== undefined ? { championships: remote.championships } : {}),
        ...(remote.championshipEnrollments !== undefined
          ? { championshipEnrollments: remote.championshipEnrollments }
          : {}),
        ...(remote.preferences !== undefined
          ? { userPreferences: { ...current.userPreferences, [actor.id]: remote.preferences } }
          : {}),
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
      const durationMinutes = minutesBetween(input.startTime, input.endTime);
      if (durationMinutes <= 0) throw new Error('Horário final deve ser maior que o inicial.');
      const openingTime = state.settings.openingTime ?? '08:00';
      const closingTime = state.settings.closingTime ?? '22:00';
      if (input.startTime < openingTime || input.endTime > closingTime) throw new Error(`Reservas permitidas apenas entre ${openingTime} e ${closingTime}.`);
      const minimumMinutes = state.settings.minimumReservationMinutes || state.settings.slotMinutes || 60;
      if (durationMinutes < minimumMinutes) throw new Error(`A duração mínima da reserva é de ${minimumMinutes} minutos.`);
      const slotMinutes = Math.max(1, state.settings.slotMinutes ?? minimumMinutes);
      const minutesFromOpening = (time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        const [openingHour, openingMinute] = openingTime.split(':').map(Number);
        return hour * 60 + minute - (openingHour * 60 + openingMinute);
      };
      if (minutesFromOpening(input.startTime) % slotMinutes !== 0 || minutesFromOpening(input.endTime) % slotMinutes !== 0) throw new Error(`Selecione horários em intervalos de ${slotMinutes} minutos.`);
      const allowedDays = state.settings.operatingDays ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      const weekDay = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date(`${input.date}T12:00:00`).getDay()];
      if (!allowedDays.includes(weekDay as (typeof allowedDays)[number])) throw new Error('A unidade não funciona no dia selecionado.');
      const maximumDate = new Date();
      maximumDate.setHours(23, 59, 59, 999);
      maximumDate.setDate(maximumDate.getDate() + (state.settings.maximumAdvanceDays ?? 90));
      if (toDateTime(input.date, input.startTime) > maximumDate) throw new Error(`Reservas podem ser feitas com até ${state.settings.maximumAdvanceDays ?? 90} dias de antecedência.`);

      const hasConflict = state.reservations.some((reservation) => {
        if (reservation.courtId !== court.id || reservation.date !== input.date || !activeStatuses.includes(reservation.status)) return false;
        return input.startTime < reservation.endTime && input.endTime > reservation.startTime;
      });
      if (hasConflict) throw new Error('Já existe uma reserva nesse horário para a quadra selecionada.');

      const client = actor.role === 'CLIENTE' ? actor : state.users.find((user) => user.id === input.clientId) ?? actor;
      const totalValue = (court.pricePerHour * durationMinutes) / 60;
      const reservationUuid = crypto.randomUUID();
      const reservation: Reservation = {
        id: reservationUuid,
        code: `PS-${reservationUuid.split('-')[0].toUpperCase()}`,
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

    const changeReservationStatus = async (reservationId: string, status: Reservation['status'], actor: User) => {
      if (actor.role !== 'ADMIN') throw new Error('Somente administradores podem alterar o status de reservas.');
      const reservation = state.reservations.find((item) => item.id === reservationId);
      if (!reservation) throw new Error('Reserva não encontrada.');
      if (reservation.status === status) return reservation;
      const allowed: Record<Reservation['status'], Reservation['status'][]> = {
        Pendente: ['Confirmada', 'Cancelada'],
        Confirmada: ['Em andamento', 'Concluída', 'Cancelada'],
        'Em andamento': ['Concluída'],
        Cancelada: ['Pendente'],
        Concluída: []
      };
      if (!allowed[reservation.status].includes(status)) throw new Error(`Transição de status inválida: ${reservation.status} para ${status}.`);
      if (activeStatuses.includes(status)) {
        const conflict = state.reservations.some((item) => item.id !== reservationId && item.courtId === reservation.courtId && item.date === reservation.date && activeStatuses.includes(item.status) && reservation.startTime < item.endTime && reservation.endTime > item.startTime);
        if (conflict) throw new Error('O horário foi ocupado por outra reserva e não pode ser reativado.');
      }
      const token = tokenFromStorage();
      const updated = dataSource === 'api' && token
        ? await changeReservationStatusWithApi(reservationId, status, token)
        : { ...reservation, status, history: [...reservation.history, `Status alterado para ${status} por ${actor.name}`] };
      setState((current) => ({
        ...current,
        reservations: current.reservations.map((item) => item.id === reservationId ? updated : item),
        payments: status === 'Cancelada' ? current.payments.map((item) => item.reservationId === reservationId ? { ...item, status: 'Cancelado' } : item) : current.payments,
        activities: [{ id: crypto.randomUUID(), actor: actor.name, action: `Status da reserva ${reservation.code} alterado para ${status}`, category: 'Reserva', createdAt: nowIso() }, ...current.activities],
        notifications: {
          ...current.notifications,
          [reservation.clientId]: [pushNotification({ title: 'Reserva atualizada', message: `${reservation.code} agora está ${status.toLocaleLowerCase('pt-BR')}.`, type: 'Reserva' }, reservation.clientId), ...(current.notifications[reservation.clientId] ?? [])]
        }
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
        transactionCode: `PAY-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
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
          { id: crypto.randomUUID(), actor: reservation.clientName, action: approve ? `Pagamento aprovado via ${method}` : `Tentativa de pagamento via ${method}`, category: 'Pagamento', createdAt: nowIso() },
          ...current.activities
        ]
      }));
      return payment;
    };

    const refundPayment = async (paymentId: string, actor: User) => {
      if (actor.role !== 'ADMIN') throw new Error('Somente administradores podem realizar estornos.');
      const payment = state.payments.find((item) => item.id === paymentId);
      if (!payment) throw new Error('Pagamento não encontrado.');
      if (payment.status !== 'Aprovado') throw new Error('Somente pagamentos aprovados podem ser estornados.');
      const reservation = state.reservations.find((item) => item.id === payment.reservationId);
      if (!reservation) throw new Error('Reserva não encontrada.');

      const token = tokenFromStorage();
      if (dataSource === 'api' && token) {
        const generation = sessionGeneration.current;
        const result = await refundPaymentWithApi(paymentId, token);
        if (generation !== sessionGeneration.current) return result.payment;
        setState((current) => ({
          ...current,
          payments: current.payments.map((item) => (item.id === paymentId ? result.payment : item)),
          reservations: current.reservations.map((item) =>
            item.id === reservation.id
              ? { ...item, status: result.reservationStatus, history: [...item.history, `Pagamento ${payment.transactionCode} estornado por ${actor.name}`] }
              : item
          ),
          notifications: {
            ...current.notifications,
            [reservation.clientId]: [
              pushNotification({ title: 'Pagamento estornado', message: `O pagamento ${payment.transactionCode} da reserva ${reservation.code} foi estornado.`, type: 'Pagamento' }, reservation.clientId),
              ...(current.notifications[reservation.clientId] ?? [])
            ]
          },
          activities: [
            { id: crypto.randomUUID(), actor: actor.name, action: `Estornou o pagamento ${payment.transactionCode} da reserva ${reservation.code}`, category: 'Pagamento', createdAt: nowIso() },
            ...current.activities
          ]
        }));
        return result.payment;
      }

      const refunded: Payment = { ...payment, status: 'Cancelado', refundedAt: nowIso() };
      const reservationStatus = reservation.status === 'Concluída' ? 'Concluída' : 'Cancelada';
      setState((current) => ({
        ...current,
        payments: current.payments.map((item) => (item.id === paymentId ? refunded : item)),
        reservations: current.reservations.map((item) =>
          item.id === reservation.id
            ? { ...item, status: reservationStatus, history: [...item.history, `Pagamento ${payment.transactionCode} estornado por ${actor.name}`] }
            : item
        ),
        notifications: {
          ...current.notifications,
          [reservation.clientId]: [
            pushNotification({ title: 'Pagamento estornado', message: `O pagamento ${payment.transactionCode} da reserva ${reservation.code} foi estornado.`, type: 'Pagamento' }, reservation.clientId),
            ...(current.notifications[reservation.clientId] ?? [])
          ]
        },
        activities: [
          { id: crypto.randomUUID(), actor: actor.name, action: `Estornou o pagamento ${payment.transactionCode} da reserva ${reservation.code}`, category: 'Pagamento', createdAt: nowIso() },
          ...current.activities
        ]
      }));
      return refunded;
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
      changeReservationStatus,
      payReservation,
      refundPayment,
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
      likePost: async (postId, userId = 'u-cliente') => {
        const post = state.posts.find((item) => item.id === postId);
        if (!post) throw new Error('Publicação não encontrada.');
        const token = tokenFromStorage();
        if (dataSource === 'api' && token && /^\d+$/.test(postId)) {
          const generation = sessionGeneration.current;
          const updated = await toggleCommunityLikeWithApi(postId, Boolean(post.likedByCurrentUser), token);
          if (generation !== sessionGeneration.current) return;
          setState((current) => ({
            ...current,
            posts: current.posts.map((item) => (item.id === postId ? { ...item, ...updated, commentItems: item.commentItems } : item))
          }));
          return;
        }
        setState((current) => ({
          ...current,
          posts: current.posts.map((item) => {
            if (item.id !== postId) return item;
            const likedBy = item.likedByUserIds ?? [];
            const liked = likedBy.includes(userId);
            return {
              ...item,
              likes: Math.max(0, item.likes + (liked ? -1 : 1)),
              likedByCurrentUser: !liked,
              likedByUserIds: liked ? likedBy.filter((id) => id !== userId) : [...likedBy, userId]
            };
          })
        }));
      },
      commentPost: (postId) => setState((current) => ({
        ...current,
        posts: current.posts.map((post) => (post.id === postId ? { ...post, comments: post.comments + 1 } : post))
      })),
      saveCommunityPost: async (draft, actor) => {
        const content = draft.content.trim().replace(/\s+/g, ' ');
        if (!content) throw new Error('Escreva o conteúdo da publicação.');
        if (content.length > 1200) throw new Error('A publicação deve ter no máximo 1.200 caracteres.');
        const token = tokenFromStorage();
        const existing = draft.id ? state.posts.find((item) => item.id === draft.id) : undefined;
        if (existing && actor.role !== 'ADMIN' && existing.authorId !== actor.id) {
          throw new Error('Você só pode editar suas próprias publicações.');
        }
        const generation = sessionGeneration.current;
        const saved = dataSource === 'api' && token && (!draft.id || /^\d+$/.test(draft.id))
          ? draft.id
            ? await updateCommunityPostWithApi(draft.id, { content, type: draft.type, modality: draft.modality }, token)
            : await createCommunityPostWithApi({ content, type: draft.type, modality: draft.modality }, token)
          : existing
            ? { ...existing, content, type: draft.type || 'COMUNIDADE', modality: draft.modality, updatedAt: nowIso() }
            : {
                id: crypto.randomUUID(), authorId: actor.id, authorName: actor.name,
                avatarUrl: actor.profile.photo, content, type: draft.type || 'COMUNIDADE', modality: draft.modality,
                likes: 0, comments: 0, likedByCurrentUser: false, likedByUserIds: [], commentItems: [], createdAt: nowIso()
              } satisfies CommunityPost;
        if (generation !== sessionGeneration.current) return saved;
        setState((current) => ({
          ...current,
          posts: current.posts.some((item) => item.id === saved.id)
            ? current.posts.map((item) => item.id === saved.id ? { ...saved, commentItems: item.commentItems } : item)
            : [saved, ...current.posts],
          activities: [{ id: crypto.randomUUID(), actor: actor.name, action: existing ? 'Publicação da Comunidade atualizada' : 'Nova publicação criada na Comunidade', category: 'Comunidade', createdAt: nowIso() }, ...current.activities]
        }));
        return saved;
      },
      removeCommunityPost: async (postId, actor) => {
        const post = state.posts.find((item) => item.id === postId);
        if (!post) throw new Error('Publicação não encontrada.');
        if (actor.role !== 'ADMIN' && post.authorId !== actor.id) throw new Error('Você só pode excluir suas próprias publicações.');
        const token = tokenFromStorage();
        const generation = sessionGeneration.current;
        if (dataSource === 'api' && token && /^\d+$/.test(postId)) await deleteCommunityPostWithApi(postId, token);
        if (generation !== sessionGeneration.current) return;
        setState((current) => ({ ...current, posts: current.posts.filter((item) => item.id !== postId) }));
      },
      loadCommunityComments: async (postId) => {
        const post = state.posts.find((item) => item.id === postId);
        if (!post) throw new Error('Publicação não encontrada.');
        const token = tokenFromStorage();
        if (dataSource === 'api' && token && /^\d+$/.test(postId)) {
          const response = await fetchCommunityCommentsWithApi(postId, token);
          setState((current) => ({
            ...current,
            posts: current.posts.map((item) => item.id === postId ? { ...item, commentItems: response.content, comments: response.totalElements } : item)
          }));
          return response.content;
        }
        return post.commentItems ?? [];
      },
      saveCommunityComment: async (postId, rawContent, actor, commentId) => {
        const content = rawContent.trim().replace(/\s+/g, ' ');
        if (!content) throw new Error('Escreva um comentário antes de enviar.');
        if (content.length > 800) throw new Error('O comentário deve ter no máximo 800 caracteres.');
        const post = state.posts.find((item) => item.id === postId);
        if (!post) throw new Error('Publicação não encontrada.');
        const existing = commentId ? post.commentItems?.find((item) => item.id === commentId) : undefined;
        if (existing && actor.role !== 'ADMIN' && existing.authorId !== actor.id) throw new Error('Você só pode editar seu próprio comentário.');
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token && /^\d+$/.test(postId)
          ? commentId
            ? await updateCommunityCommentWithApi(commentId, content, token)
            : await createCommunityCommentWithApi(postId, content, token)
          : existing
            ? { ...existing, content, updatedAt: nowIso() }
            : { id: crypto.randomUUID(), postId, authorId: actor.id, authorName: actor.name, avatarUrl: actor.profile.photo, content, editable: true, createdAt: nowIso() };
        setState((current) => ({
          ...current,
          posts: current.posts.map((item) => {
            if (item.id !== postId) return item;
            const comments = item.commentItems ?? [];
            const updated = comments.some((comment) => comment.id === saved.id)
              ? comments.map((comment) => comment.id === saved.id ? saved : comment)
              : [...comments, saved];
            return { ...item, commentItems: updated, comments: updated.length };
          })
        }));
        return saved;
      },
      removeCommunityComment: async (postId, commentId, actor) => {
        const comment = state.posts.find((item) => item.id === postId)?.commentItems?.find((item) => item.id === commentId);
        if (!comment) throw new Error('Comentário não encontrado.');
        if (actor.role !== 'ADMIN' && comment.authorId !== actor.id) throw new Error('Você só pode excluir seu próprio comentário.');
        const token = tokenFromStorage();
        if (dataSource === 'api' && token && /^\d+$/.test(commentId)) await deleteCommunityCommentWithApi(commentId, token);
        setState((current) => ({
          ...current,
          posts: current.posts.map((item) => {
            if (item.id !== postId) return item;
            const updated = (item.commentItems ?? []).filter((entry) => entry.id !== commentId);
            return { ...item, commentItems: updated, comments: updated.length };
          })
        }));
      },
      addPartnerAd: (ad) => {
        const saved = { ...ad, id: crypto.randomUUID() };
        setState((current) => ({ ...current, partnerAds: [saved, ...current.partnerAds] }));
        return saved;
      },
      saveSportsProfile: async (profile) => {
        if (!profile.city.trim()) throw new Error('Informe a cidade do perfil esportivo.');
        if (!profile.presentation.trim()) throw new Error('Escreva uma apresentação para outros jogadores.');
        if (profile.modalities.length === 0) throw new Error('Adicione ao menos uma modalidade.');
        if (!profile.modalities.some((item) => item.modality === profile.primaryModality)) {
          throw new Error('A modalidade principal deve estar na lista de modalidades praticadas.');
        }
        const modalityKeys = profile.modalities.map((item) => item.modality);
        if (new Set(modalityKeys).size !== modalityKeys.length) throw new Error('Cada modalidade pode aparecer apenas uma vez.');
        for (const slot of profile.availabilities) {
          if (slot.startTime >= slot.endTime) throw new Error('O horário inicial deve ser anterior ao horário final.');
          const overlaps = profile.availabilities.some((other) => other !== slot && other.dayOfWeek === slot.dayOfWeek
            && slot.startTime < other.endTime && slot.endTime > other.startTime);
          if (overlaps) throw new Error('Existem horários sobrepostos no mesmo dia.');
        }
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token ? await saveSportsProfileWithApi(profile, token) : {
          ...profile,
          id: profile.id || crypto.randomUUID(),
          modalities: profile.modalities.map((item) => ({ ...item, primary: item.modality === profile.primaryModality }))
        };
        setState((current) => ({
          ...current,
          sportsProfiles: current.sportsProfiles.some((item) => item.userId === saved.userId)
            ? current.sportsProfiles.map((item) => item.userId === saved.userId ? saved : item)
            : [saved, ...current.sportsProfiles]
        }));
        return saved;
      },
      sendPartnerInterest: async (receiverId, message, actor) => {
        if (receiverId === actor.id) throw new Error('Não é possível enviar interesse para o próprio perfil.');
        const active = state.partnerInterests.find((item) =>
          ((item.senderId === actor.id && item.receiverId === receiverId) || (item.senderId === receiverId && item.receiverId === actor.id))
          && ['PENDENTE', 'ACEITO'].includes(item.status));
        if (active) throw new Error('Já existe um interesse ativo entre estes jogadores.');
        const receiver = state.users.find((item) => item.id === receiverId);
        if (!receiver) throw new Error('Jogador não encontrado.');
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token && /^\d+$/.test(receiverId)
          ? await sendPartnerInterestWithApi(receiverId, message, token)
          : { id: crypto.randomUUID(), senderId: actor.id, senderName: actor.name, senderAvatarUrl: actor.profile.photo, receiverId, receiverName: receiver.name, receiverAvatarUrl: receiver.profile.photo, status: 'PENDENTE' as const, message: message.trim() || undefined, createdAt: nowIso() };
        setState((current) => ({
          ...current,
          partnerInterests: [saved, ...current.partnerInterests.filter((item) => item.id !== saved.id)],
          notifications: {
            ...current.notifications,
            [receiverId]: [pushNotification({ title: 'Novo interesse esportivo', message: `${actor.name} quer praticar esportes com você.`, type: 'Parceiro' }, receiverId), ...(current.notifications[receiverId] ?? [])]
          },
          activities: [{ id: crypto.randomUUID(), actor: actor.name, action: `Interesse enviado para ${receiver.name}`, category: 'Parceiros', createdAt: nowIso() }, ...current.activities]
        }));
        return saved;
      },
      respondPartnerInterest: async (interestId, accept, actor) => {
        const interest = state.partnerInterests.find((item) => item.id === interestId);
        if (!interest) throw new Error('Solicitação não encontrada.');
        if (interest.receiverId !== actor.id) throw new Error('Somente o destinatário pode responder esta solicitação.');
        if (interest.status !== 'PENDENTE') throw new Error('Esta solicitação já foi respondida.');
        const token = tokenFromStorage();
        const sender = state.users.find((item) => item.id === interest.senderId);
        const saved = dataSource === 'api' && token && /^\d+$/.test(interestId)
          ? await respondPartnerInterestWithApi(interestId, accept, token)
          : { ...interest, status: accept ? 'ACEITO' as const : 'RECUSADO' as const, respondedAt: nowIso(), contactEmail: accept ? sender?.email : undefined };
        setState((current) => ({
          ...current,
          partnerInterests: current.partnerInterests.map((item) => item.id === interestId ? saved : item),
          notifications: {
            ...current.notifications,
            [interest.senderId]: [pushNotification({ title: accept ? 'Interesse aceito' : 'Interesse recusado', message: `${actor.name} ${accept ? 'aceitou' : 'recusou'} seu interesse esportivo.`, type: 'Parceiro' }, interest.senderId), ...(current.notifications[interest.senderId] ?? [])]
          }
        }));
        return saved;
      },
      cancelPartnerInterest: async (interestId, actor) => {
        const interest = state.partnerInterests.find((item) => item.id === interestId);
        if (!interest) throw new Error('Solicitação não encontrada.');
        if (interest.senderId !== actor.id) throw new Error('Somente quem enviou pode cancelar esta solicitação.');
        if (!['PENDENTE', 'ACEITO'].includes(interest.status)) throw new Error('Esta solicitação não pode mais ser cancelada.');
        const token = tokenFromStorage();
        if (dataSource === 'api' && token && /^\d+$/.test(interestId)) await cancelPartnerInterestWithApi(interestId, token);
        setState((current) => ({
          ...current,
          partnerInterests: current.partnerInterests.map((item) => item.id === interestId ? { ...item, status: 'CANCELADO', cancelledAt: nowIso() } : item)
        }));
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
      saveChampionship: async (championship, actor) => {
        if (actor.role !== 'ADMIN') throw new Error('Apenas administradores podem gerenciar campeonatos.');
        if (!championship.name.trim() || !championship.description?.trim()) throw new Error('Informe nome e descrição do campeonato.');
        if (!championship.courtId || !championship.city?.trim() || !championship.location?.trim()) throw new Error('Informe quadra, cidade e local.');
        if (!championship.endDate || !championship.registrationDeadline) throw new Error('Informe todas as datas do campeonato.');
        if (championship.endDate < championship.startDate) throw new Error('A data de término deve ser posterior ao início.');
        if (championship.registrationDeadline > championship.startDate) throw new Error('O prazo de inscrição não pode ser posterior ao início.');
        const court = state.courts.find((item) => item.id === championship.courtId);
        if (!court || court.modality !== championship.modality) throw new Error('Selecione uma quadra da mesma modalidade do campeonato.');
        const existing = state.championships.find((item) => item.id === championship.id);
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token
          ? await saveChampionshipWithApi(championship, token)
          : { ...championship, id: existing ? championship.id : crypto.randomUUID(), createdAt: existing?.createdAt ?? nowIso(), updatedAt: nowIso(), enrolledParticipants: existing?.enrolledParticipants ?? 0, availableSpots: Math.max(0, (championship.maxParticipants ?? 0) - (existing?.enrolledParticipants ?? 0)) };
        setState((current) => ({
          ...current,
          championships: current.championships.some((item) => item.id === saved.id)
            ? current.championships.map((item) => item.id === saved.id ? saved : item)
            : [saved, ...current.championships]
        }));
        return saved;
      },
      changeChampionshipStatus: async (championshipId, status, actor) => {
        if (actor.role !== 'ADMIN') throw new Error('Apenas administradores podem alterar o status.');
        const championship = state.championships.find((item) => item.id === championshipId);
        if (!championship) throw new Error('Campeonato não encontrado.');
        const transitions: Record<string, string[]> = {
          RASCUNHO: ['INSCRICOES_ABERTAS', 'CANCELADO'],
          INSCRICOES_ABERTAS: ['INSCRICOES_ENCERRADAS', 'CANCELADO'],
          INSCRICOES_ENCERRADAS: ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'CANCELADO'],
          EM_ANDAMENTO: ['CONCLUIDO', 'CANCELADO'],
          CONCLUIDO: [], CANCELADO: []
        };
        if (status !== championship.status && !(transitions[championship.status] ?? []).includes(status)) {
          throw new Error('Esta transição de status não é permitida.');
        }
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token && /^\d+$/.test(championshipId)
          ? await changeChampionshipStatusWithApi(championshipId, status, token)
          : { ...championship, status, updatedAt: nowIso() };
        setState((current) => ({ ...current, championships: current.championships.map((item) => item.id === championshipId ? saved : item) }));
        return saved;
      },
      removeChampionship: async (championshipId, actor) => {
        if (actor.role !== 'ADMIN') throw new Error('Apenas administradores podem excluir campeonatos.');
        const championship = state.championships.find((item) => item.id === championshipId);
        if (!championship) throw new Error('Campeonato não encontrado.');
        if (!['RASCUNHO', 'CANCELADO'].includes(championship.status)) throw new Error('Somente campeonatos em rascunho ou cancelados podem ser excluídos.');
        if (state.championshipEnrollments.some((item) => item.championshipId === championshipId && item.status === 'ATIVA')) throw new Error('Não é permitido excluir um campeonato com inscritos ativos.');
        const token = tokenFromStorage();
        if (dataSource === 'api' && token && /^\d+$/.test(championshipId)) await deleteChampionshipWithApi(championshipId, token);
        setState((current) => ({ ...current, championships: current.championships.filter((item) => item.id !== championshipId) }));
      },
      registerChampionship: async (championshipId, actor) => {
        const championship = state.championships.find((item) => item.id === championshipId);
        if (!championship) throw new Error('Campeonato não encontrado.');
        if (championship.status !== 'INSCRICOES_ABERTAS') throw new Error('As inscrições deste campeonato não estão abertas.');
        if (championship.registrationDeadline && championship.registrationDeadline < new Date().toISOString().slice(0, 10)) throw new Error('O prazo de inscrição foi encerrado.');
        if ((championship.availableSpots ?? 1) <= 0) throw new Error('Não há vagas disponíveis.');
        if (state.championshipEnrollments.some((item) => item.championshipId === championshipId && item.playerId === actor.id && item.status === 'ATIVA')) throw new Error('Você já está inscrito neste campeonato.');
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token && /^\d+$/.test(championshipId)
          ? await enrollChampionshipWithApi(championshipId, token)
          : { id: crypto.randomUUID(), championshipId, championshipName: championship.name, playerId: actor.id, playerName: actor.name, playerAvatarUrl: actor.profile.photo, status: 'ATIVA' as const, enrolledAt: nowIso() };
        setState((current) => ({
          ...current,
          championshipEnrollments: [saved, ...current.championshipEnrollments.filter((item) => item.id !== saved.id)],
          championships: current.championships.map((item) => item.id === championshipId ? { ...item, currentUserEnrolled: true, enrolledParticipants: (item.enrolledParticipants ?? 0) + 1, availableSpots: Math.max(0, (item.availableSpots ?? (item.maxParticipants ?? 1)) - 1) } : item),
          notifications: { ...current.notifications, [actor.id]: [pushNotification({ title: 'Inscrição confirmada', message: `Sua inscrição em ${championship.name} foi confirmada.`, type: 'Campeonato' }, actor.id), ...(current.notifications[actor.id] ?? [])] }
        }));
        return saved;
      },
      cancelChampionshipEnrollment: async (championshipId, actor) => {
        const championship = state.championships.find((item) => item.id === championshipId);
        if (!championship) throw new Error('Campeonato não encontrado.');
        const enrollment = state.championshipEnrollments.find((item) => item.championshipId === championshipId && item.playerId === actor.id && item.status === 'ATIVA');
        if (!enrollment) throw new Error('Inscrição ativa não encontrada.');
        if (championship.startDate <= new Date().toISOString().slice(0, 10) || ['EM_ANDAMENTO', 'CONCLUIDO'].includes(championship.status)) throw new Error('O prazo para cancelar esta inscrição foi encerrado.');
        const token = tokenFromStorage();
        if (dataSource === 'api' && token && /^\d+$/.test(championshipId)) await cancelChampionshipEnrollmentWithApi(championshipId, token);
        setState((current) => ({
          ...current,
          championshipEnrollments: current.championshipEnrollments.map((item) => item.id === enrollment.id ? { ...item, status: 'CANCELADA', cancelledAt: nowIso() } : item),
          championships: current.championships.map((item) => item.id === championshipId ? { ...item, currentUserEnrolled: false, enrolledParticipants: Math.max(0, (item.enrolledParticipants ?? 1) - 1), availableSpots: (item.availableSpots ?? 0) + 1 } : item)
        }));
      },
      loadChampionshipParticipants: async (championshipId) => {
        const token = tokenFromStorage();
        if (dataSource === 'api' && token && /^\d+$/.test(championshipId)) {
          const participants = await fetchChampionshipParticipantsWithApi(championshipId, token);
          setState((current) => ({
            ...current,
            championshipEnrollments: [
              ...current.championshipEnrollments.filter((item) => item.championshipId !== championshipId),
              ...participants
            ]
          }));
          return participants;
        }
        return state.championshipEnrollments.filter((item) => item.championshipId === championshipId && item.status === 'ATIVA');
      },
      saveCurrentProfile: async (user) => {
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token ? await saveProfileWithApi(user, token) : user;
        setState((current) => ({ ...current, users: current.users.map((item) => item.id === saved.id ? saved : item) }));
        return saved;
      },
      removeCurrentAvatar: async (user) => {
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token ? await removeProfileAvatarWithApi(token) : { ...user, profile: { ...user.profile, photo: '' } };
        setState((current) => ({ ...current, users: current.users.map((item) => item.id === saved.id ? saved : item) }));
        return saved;
      },
      changeCurrentPassword: async (user, currentPassword, newPassword, confirmation) => {
        if (newPassword !== confirmation) throw new Error('A confirmação da nova senha não confere.');
        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) throw new Error('Use ao menos 8 caracteres, com maiúscula, minúscula e número.');
        const token = tokenFromStorage();
        if (dataSource === 'api' && token) {
          await changePasswordWithApi(currentPassword, newPassword, confirmation, token);
          return;
        }
        const overrides = JSON.parse(localStorage.getItem(DEMO_PASSWORDS_KEY) || '{}') as Record<string, string>;
        const expected = overrides[user.email.toLowerCase()] ?? demoCredentials[user.email.toLowerCase() as keyof typeof demoCredentials];
        if (expected && currentPassword !== expected) throw new Error('A senha atual está incorreta.');
        overrides[user.email.toLowerCase()] = newPassword;
        localStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(overrides));
      },
      saveUserPreferences: async (userId, preferences) => {
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token ? await savePreferencesWithApi(preferences, token) : preferences;
        const visualTheme = saved.theme === 'LIGHT' ? 'light' : saved.theme === 'DARK' ? 'dark' : window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        setState((current) => ({
          ...current,
          userPreferences: { ...current.userPreferences, [userId]: saved },
          preferences: { ...current.preferences, theme: visualTheme, favoriteModalities: saved.favoriteModalities }
        }));
        return saved;
      },
      submitReview: async (reservationId, ratings, comment, actor) => {
        const reservation = state.reservations.find((item) => item.id === reservationId);
        if (!reservation) throw new Error('Reserva não encontrada.');
        if (reservation.clientId !== actor.id) throw new Error('Você só pode avaliar suas próprias reservas.');
        if (reservation.status !== 'Concluída') throw new Error('A avaliação fica disponível após a conclusão da reserva.');
        if (state.reviews.some((item) => item.reservationId === reservationId)) throw new Error('Esta reserva já foi avaliada.');
        const scores = Object.values(ratings);
        if (scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) throw new Error('Informe notas de 1 a 5 em todos os critérios.');
        const normalizedComment = comment.trim().replace(/\s+/g, ' ');
        if (normalizedComment.length < 3) throw new Error('Escreva um comentário com ao menos 3 caracteres.');
        const token = tokenFromStorage();
        const saved: Review = dataSource === 'api' && token
          ? await createReviewWithApi({ reservationId, ...ratings, comment: normalizedComment }, token)
          : {
              id: crypto.randomUUID(),
              reservationId,
              userName: actor.name,
              avatarUrl: actor.profile.photo || undefined,
              courtName: reservation.courtName,
              ...ratings,
              average: Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10,
              comment: normalizedComment,
              createdAt: nowIso()
            };
        setState((current) => ({
          ...current,
          reviews: [saved, ...current.reviews],
          activities: [{ id: crypto.randomUUID(), actor: actor.name, action: `Avaliação registrada para ${reservation.courtName}`, category: 'Avaliação', createdAt: nowIso() }, ...current.activities],
          notifications: {
            ...current.notifications,
            [actor.id]: [pushNotification({ title: 'Avaliação publicada', message: `Sua avaliação da ${reservation.courtName} foi registrada.`, type: 'Avaliação' }, actor.id), ...(current.notifications[actor.id] ?? [])]
          }
        }));
        return saved;
      },
      registerDemoUser: (input) => {
        const email = input.email.trim().toLowerCase();
        if (state.users.some((item) => item.email.toLowerCase() === email)) throw new Error('Já existe uma conta com este e-mail.');
        const user: User = {
          id: crypto.randomUUID(), name: input.name.trim(), email, role: 'CLIENTE', active: true,
          profile: { photo: '', bio: '', city: 'Não informada', phone: input.phone?.trim(), availability: '', memberSince: new Date().toISOString().slice(0, 10), favoriteModality: 'Beach Tennis', sports: ['Beach Tennis'], level: 'Iniciante', reservationsDone: 0, matchesPlayed: 0, hoursOnCourt: 0, attendanceRate: 100, achievementsUnlocked: 0 }
        };
        const preferences: UserPreferences = { theme: 'SYSTEM', notificationsEnabled: true, reservationReminderHours: 2, emailNotifications: true, browserNotifications: true, defaultCity: '', favoriteModalities: ['Beach Tennis'], preferredTimes: '', privateProfile: false, discoverableByPartners: true, language: 'pt-BR' };
        const overrides = JSON.parse(localStorage.getItem(DEMO_PASSWORDS_KEY) || '{}') as Record<string, string>;
        overrides[email] = input.password;
        localStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(overrides));
        setState((current) => ({ ...current, users: [user, ...current.users], userPreferences: { ...current.userPreferences, [user.id]: preferences }, notifications: { ...current.notifications, [user.id]: [] } }));
        return user;
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
      saveSettings: async (settings) => {
        const token = tokenFromStorage();
        const saved = dataSource === 'api' && token ? await saveSettingsWithApi(settings, token) : settings;
        setState((current) => ({ ...current, settings: saved }));
        return saved;
      },
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
        localStorage.removeItem(DEMO_STORAGE_KEY);
        localStorage.removeItem(DEMO_PASSWORDS_KEY);
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
