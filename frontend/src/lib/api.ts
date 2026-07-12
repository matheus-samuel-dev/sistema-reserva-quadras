import type {
  Activity,
  Achievement,
  Championship,
  CommunityPost,
  Court,
  CourtStatus,
  Modality,
  NotificationItem,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PartnerAd,
  RankingEntry,
  Reservation,
  ReservationFormInput,
  ReservationStatus,
  Role,
  Review,
  Settings,
  User
} from './types';

const configuredBase = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = (configuredBase || '/api').replace(/\/$/, '');
export const remoteApiEnabled = import.meta.env.MODE !== 'test';

type ApiErrorPayload = {
  error?: string;
  details?: string[];
  message?: string;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const request = async <T>(
  path: string,
  init: RequestInit = {},
  token?: string | null
): Promise<T> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers
      }
    });

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? ((await response.json()) as T | ApiErrorPayload)
      : await response.text();

    if (!response.ok) {
      const errorPayload = typeof payload === 'object' && payload !== null ? (payload as ApiErrorPayload) : null;
      const details = errorPayload?.details ?? [];
      const message = details[0] || errorPayload?.message || errorPayload?.error || `A API respondeu com status ${response.status}.`;
      if (response.status === 401 && token) {
        window.dispatchEvent(new CustomEvent('playspace:session-expired', { detail: { token } }));
      }
      throw new ApiRequestError(message, response.status, details);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiRequestError('A API demorou demais para responder.', 0);
    }
    throw new ApiRequestError('Não foi possível conectar à API do PlaySpace.', 0);
  } finally {
    window.clearTimeout(timer);
  }
};

const optionalRequest = async <T>(path: string, token: string): Promise<T | undefined> => {
  try {
    return await request<T>(path, {}, token);
  } catch (error) {
    // Falhas de autenticação nunca são mascaradas como indisponibilidade de um
    // módulo opcional; elas precisam invalidar a sessão inteira.
    if (error instanceof ApiRequestError && error.status === 401) throw error;
    return undefined;
  }
};

const modalityFromApi: Record<string, Modality> = {
  BEACH_TENNIS: 'Beach Tennis',
  FUTEVOLEI: 'Futevôlei',
  SOCIETY: 'Society',
  TENIS: 'Tênis',
  VOLEI: 'Vôlei',
  BASQUETE: 'Basquete'
};

const modalityToApi: Record<Modality, string> = Object.fromEntries(
  Object.entries(modalityFromApi).map(([key, value]) => [value, key])
) as Record<Modality, string>;

const courtStatusFromApi: Record<string, CourtStatus> = {
  DISPONIVEL: 'Disponível',
  EM_MANUTENCAO: 'Em manutenção',
  INDISPONIVEL: 'Indisponível',
  INATIVA: 'Indisponível'
};

const courtStatusToApi: Record<CourtStatus, string> = {
  Disponível: 'DISPONIVEL',
  'Em manutenção': 'EM_MANUTENCAO',
  Indisponível: 'INDISPONIVEL'
};

const reservationStatusFromApi: Record<string, ReservationStatus> = {
  PENDENTE: 'Pendente',
  CONFIRMADA: 'Confirmada',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada'
};

const paymentMethodFromApi: Record<string, PaymentMethod> = {
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito'
};

const paymentMethodToApi: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  'Cartão de Crédito': 'CARTAO_CREDITO',
  'Cartão de Débito': 'CARTAO_DEBITO'
};

const paymentStatusFromApi: Record<string, PaymentStatus> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  CANCELADO: 'Cancelado',
  ESTORNADO: 'Cancelado'
};

const modalityAliases: Record<string, Modality> = {
  'Beach Tennis': 'Beach Tennis',
  'Futevôlei': 'Futevôlei',
  Futevolei: 'Futevôlei',
  Society: 'Society',
  'Tênis': 'Tênis',
  Tenis: 'Tênis',
  'Vôlei': 'Vôlei',
  Volei: 'Vôlei',
  Basquete: 'Basquete'
};

const pickModality = (value?: string | null): Modality =>
  modalityFromApi[value ?? ''] ?? modalityAliases[value ?? ''] ?? 'Beach Tennis';

type ApiUser = Record<string, unknown> & {
  id: number | string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

type ApiCourt = Record<string, unknown> & {
  id: number | string;
  name: string;
};

type ApiReservation = Record<string, unknown> & {
  id: number | string;
  code: string;
  client: ApiUser;
  court: ApiCourt;
};

export type ApiReservationAvailability = Record<string, unknown> & {
  id: number | string;
  courtId: number | string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

type ApiPayment = Record<string, unknown> & {
  id: number | string;
  reservation: ApiReservation;
};

type ApiActivity = {
  id: number | string;
  actor: string;
  action: string;
  category: string;
  createdAt?: string | null;
};

type ApiAdminDashboard = {
  activity?: ApiActivity[];
};

export type ApiCommunityPost = {
  id: number | string;
  authorId: number | string;
  authorName: string;
  avatarUrl?: string | null;
  content: string;
  type: string;
  likes: number;
  comments: number;
  createdAt: string;
};

export type ApiPartnerAd = {
  id: number | string;
  playerId: number | string;
  playerName: string;
  avatarUrl?: string | null;
  modality: string;
  level: string;
  city: string;
  availability: string;
  notes: string;
  createdAt: string;
};

export type ApiChampionship = {
  id: number | string;
  name: string;
  modality: string;
  startDate: string;
  categories: string;
  prize: string;
  status: string;
  regulation: string;
  bracket: string[];
  createdAt: string;
};

export type ApiAchievement = {
  id: number | string;
  icon: string;
  title: string;
  description: string;
  progress: number;
  targetValue: number;
  percentComplete: number;
  unlockedAt?: string | null;
  createdAt: string;
};

export type ApiReview = {
  id: number | string;
  userName: string;
  avatarUrl?: string | null;
  courtName: string;
  ratings?: {
    cleaning?: number;
    lighting?: number;
    organization?: number;
    service?: number;
    courtQuality?: number;
  };
  average: number;
  comment: string;
  createdAt: string;
};

export type ApiRankingEntry = {
  id: number | string;
  name: string;
  city?: string | null;
  favoriteModality?: string | null;
  reservations?: number;
  hours?: number;
  attendanceRate?: number;
};

type ApiSettings = {
  company?: string;
  hours?: string;
  cancelationRuleHours?: number;
  minimumReservationMinutes?: number;
  modalities?: string[];
  defaultPrices?: Record<string, number>;
};

export const mapApiUser = (raw: ApiUser): User => {
  const name = String(raw.name ?? 'Usuário PlaySpace');
  const practicedSports = Array.isArray(raw.practicedSports) ? raw.practicedSports.map(String) : [];
  const favoriteModality = pickModality(String(raw.favoriteModality ?? ''));
  const sports = practicedSports.map(pickModality).filter((item, index, list) => list.indexOf(item) === index);

  return {
    id: String(raw.id),
    name,
    email: String(raw.email ?? ''),
    role: raw.role === 'ADMIN' ? 'ADMIN' : 'CLIENTE',
    active: raw.active !== false,
    profile: {
      photo: String(raw.avatarUrl ?? ''),
      bio: String(raw.bio ?? ''),
      city: String(raw.city ?? 'Não informada'),
      memberSince: String(raw.memberSince ?? new Date().toISOString().slice(0, 10)),
      favoriteModality,
      sports: sports.length ? sports : [favoriteModality],
      level: ['Iniciante', 'Intermediário', 'Avançado', 'Competitivo'].includes(String(raw.sportsLevel))
        ? (String(raw.sportsLevel) as User['profile']['level'])
        : raw.role === 'ADMIN'
          ? 'Competitivo'
          : 'Intermediário',
      reservationsDone: Number(raw.reservationsDone ?? 0),
      matchesPlayed: Number(raw.matchesPlayed ?? 0),
      hoursOnCourt: Number(raw.hoursOnCourt ?? 0),
      attendanceRate: Number(raw.attendanceRate ?? 100),
      achievementsUnlocked: Array.isArray(raw.achievements) ? raw.achievements.length : 0
    }
  };
};

export const mapApiCourt = (raw: ApiCourt): Court => ({
  id: String(raw.id),
  name: String(raw.name ?? 'Quadra'),
  modality: pickModality(String(raw.modality ?? '')),
  description: String(raw.description ?? ''),
  pricePerHour: Number(raw.pricePerHour ?? 0),
  playerCapacity: Number(raw.playerCapacity ?? 1),
  status: courtStatusFromApi[String(raw.status ?? '')] ?? 'Indisponível',
  image: String(raw.imageUrl ?? ''),
  location: String(raw.location ?? ''),
  lighting: Boolean(raw.lighting),
  covered: Boolean(raw.covered),
  rating: Number(raw.rating ?? 0)
});

export const mapApiReservation = (raw: ApiReservation): Reservation => ({
  id: String(raw.id),
  code: String(raw.code ?? ''),
  clientId: String(raw.client?.id ?? ''),
  clientName: String(raw.client?.name ?? 'Cliente'),
  courtId: String(raw.court?.id ?? ''),
  courtName: String(raw.court?.name ?? 'Quadra'),
  modality: pickModality(String(raw.modality ?? raw.court?.modality ?? '')),
  date: String(raw.date ?? ''),
  startTime: String(raw.startTime ?? '').slice(0, 5),
  endTime: String(raw.endTime ?? '').slice(0, 5),
  players: Number(raw.players ?? 1),
  totalValue: Number(raw.totalValue ?? 0),
  status: reservationStatusFromApi[String(raw.status ?? '')] ?? 'Pendente',
  paymentMethod: paymentMethodFromApi[String(raw.paymentMethod ?? '')] ?? 'PIX',
  notes: raw.notes ? String(raw.notes) : undefined,
  history: String(raw.history ?? 'Reserva criada').split('\n').filter(Boolean)
});

const occupyingReservationStatuses = new Set(['PENDENTE', 'CONFIRMADA', 'EM_ANDAMENTO']);

export const mergeClientAvailability = (
  ownReservations: Reservation[],
  availability: ApiReservationAvailability[],
  courts: Court[]
): Reservation[] => {
  const ownReservationIds = new Set(ownReservations.map((reservation) => reservation.id));
  const courtsById = new Map(courts.map((court) => [court.id, court]));

  const occupiedSlots = availability
    .filter((slot) => occupyingReservationStatuses.has(String(slot.status)) && !ownReservationIds.has(String(slot.id)))
    .map((slot): Reservation => {
      const courtId = String(slot.courtId ?? '');
      const court = courtsById.get(courtId);

      return {
        id: `occupied-${String(slot.id)}`,
        code: 'Horário ocupado',
        clientId: 'private-occupied-slot',
        clientName: 'Reservado',
        courtId,
        courtName: court?.name ?? 'Quadra',
        modality: court?.modality ?? 'Beach Tennis',
        date: String(slot.date ?? ''),
        startTime: String(slot.startTime ?? '').slice(0, 5),
        endTime: String(slot.endTime ?? '').slice(0, 5),
        players: 0,
        totalValue: 0,
        status: reservationStatusFromApi[String(slot.status)] ?? 'Pendente',
        paymentMethod: 'PIX',
        notes: undefined,
        history: ['Horário indisponível']
      };
    });

  return [...ownReservations, ...occupiedSlots];
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type AvailabilityRange = { start: string; end: string };

export const availabilityWindow = (reference = new Date()): AvailabilityRange => {
  const start = new Date(reference);
  const end = new Date(reference);
  start.setDate(start.getDate() - 30);
  end.setDate(end.getDate() + 180);
  return { start: formatLocalDate(start), end: formatLocalDate(end) };
};

export const fetchAvailabilityRangeWithApi = (
  start: string,
  end: string,
  token: string
) => request<ApiReservationAvailability[]>(
  `/reservations/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  {},
  token
);

export const mapApiPayment = (raw: ApiPayment): Payment => ({
  id: String(raw.id),
  reservationId: String(raw.reservation?.id ?? ''),
  reservationCode: String(raw.reservation?.code ?? ''),
  method: paymentMethodFromApi[String(raw.method ?? '')] ?? 'PIX',
  status: paymentStatusFromApi[String(raw.status ?? '')] ?? 'Pendente',
  amount: Number(raw.amount ?? 0),
  transactionCode: String(raw.transactionCode ?? ''),
  paidAt: raw.paidAt ? String(raw.paidAt) : undefined
});

export const mapApiNotification = (raw: Record<string, unknown>): NotificationItem => ({
  id: String(raw.id ?? ''),
  title: String(raw.title ?? 'Notificação'),
  message: String(raw.message ?? ''),
  type: String(raw.type ?? 'INFO'),
  read: Boolean(raw.read),
  createdAt: String(raw.createdAt ?? new Date().toISOString())
});

export const mapApiActivity = (raw: ApiActivity): Activity => ({
  id: String(raw.id),
  actor: String(raw.actor ?? 'PlaySpace'),
  action: String(raw.action ?? 'Atividade registrada'),
  category: String(raw.category ?? 'OPERACAO'),
  createdAt: String(raw.createdAt ?? new Date().toISOString())
});

export const mapApiCommunityPost = (raw: ApiCommunityPost): CommunityPost => ({
  id: String(raw.id),
  authorId: String(raw.authorId),
  authorName: String(raw.authorName ?? 'Comunidade PlaySpace'),
  avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
  content: String(raw.content ?? ''),
  type: String(raw.type ?? 'Comunidade'),
  likes: Number(raw.likes ?? 0),
  comments: Number(raw.comments ?? 0),
  createdAt: String(raw.createdAt ?? new Date().toISOString())
});

export const mapApiPartnerAd = (raw: ApiPartnerAd): PartnerAd => ({
  id: String(raw.id),
  playerId: String(raw.playerId),
  playerName: String(raw.playerName ?? 'Jogador PlaySpace'),
  avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
  modality: pickModality(raw.modality),
  level: String(raw.level ?? 'Intermediário'),
  city: String(raw.city ?? 'Não informada'),
  availability: String(raw.availability ?? ''),
  notes: String(raw.notes ?? ''),
  createdAt: String(raw.createdAt ?? new Date().toISOString())
});

export const mapApiChampionship = (raw: ApiChampionship): Championship => ({
  id: String(raw.id),
  name: String(raw.name ?? 'Campeonato PlaySpace'),
  modality: pickModality(raw.modality),
  startDate: String(raw.startDate ?? ''),
  categories: String(raw.categories ?? ''),
  regulation: String(raw.regulation ?? ''),
  prize: String(raw.prize ?? ''),
  status: String(raw.status ?? 'Em breve'),
  bracket: Array.isArray(raw.bracket) ? raw.bracket.map(String) : [],
  createdAt: String(raw.createdAt ?? new Date().toISOString())
});

export const mapApiAchievement = (raw: ApiAchievement): Achievement => ({
  id: String(raw.id),
  icon: String(raw.icon ?? 'Medal'),
  title: String(raw.title ?? 'Conquista'),
  description: String(raw.description ?? ''),
  progress: Number(raw.progress ?? 0),
  target: Number(raw.targetValue ?? 0),
  percent: Number(raw.percentComplete ?? 0),
  unlockedAt: raw.unlockedAt ? String(raw.unlockedAt) : undefined,
  createdAt: String(raw.createdAt ?? new Date().toISOString())
});

export const mapApiReview = (raw: ApiReview): Review => ({
  id: String(raw.id),
  userName: String(raw.userName ?? 'Cliente PlaySpace'),
  avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
  courtName: String(raw.courtName ?? 'Quadra PlaySpace'),
  cleaning: Number(raw.ratings?.cleaning ?? 0),
  lighting: Number(raw.ratings?.lighting ?? 0),
  organization: Number(raw.ratings?.organization ?? 0),
  service: Number(raw.ratings?.service ?? 0),
  courtQuality: Number(raw.ratings?.courtQuality ?? 0),
  average: Number(raw.average ?? 0),
  comment: String(raw.comment ?? ''),
  createdAt: String(raw.createdAt ?? new Date().toISOString())
});

export const mapApiRankingEntry = (raw: ApiRankingEntry): RankingEntry => ({
  id: String(raw.id),
  name: String(raw.name ?? 'Jogador PlaySpace'),
  city: String(raw.city ?? 'Não informada'),
  favoriteModality: pickModality(raw.favoriteModality),
  reservations: Number(raw.reservations ?? 0),
  hours: Number(raw.hours ?? 0),
  attendanceRate: Number(raw.attendanceRate ?? 0)
});

export const mapApiSettings = (raw: ApiSettings): Settings => {
  const modalities = Array.isArray(raw.modalities)
    ? raw.modalities.map(pickModality).filter((item, index, list) => list.indexOf(item) === index)
    : [];
  const defaultPrices = Object.entries(raw.defaultPrices ?? {}).reduce<Partial<Record<Modality, number>>>((prices, [key, value]) => {
    prices[pickModality(key)] = Number(value ?? 0);
    return prices;
  }, {});

  return {
    company: String(raw.company ?? 'PlaySpace Club'),
    hours: String(raw.hours ?? '08:00 - 22:00'),
    cancelationRuleHours: Number(raw.cancelationRuleHours ?? 2),
    minimumReservationMinutes: Number(raw.minimumReservationMinutes ?? 60),
    modalities: modalities.length ? modalities : (Object.values(modalityFromApi) as Modality[]),
    defaultPrices: {
      'Beach Tennis': defaultPrices['Beach Tennis'] ?? 0,
      'Futevôlei': defaultPrices['Futevôlei'] ?? 0,
      Society: defaultPrices.Society ?? 0,
      'Tênis': defaultPrices['Tênis'] ?? 0,
      'Vôlei': defaultPrices['Vôlei'] ?? 0,
      Basquete: defaultPrices.Basquete ?? 0
    }
  };
};

export const loginWithApi = async (email: string, password: string) => {
  const response = await request<{ token: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  return { token: response.token, user: mapApiUser(response.user) };
};

export const getCurrentUser = async (token: string) => {
  const response = await request<{ user: ApiUser }>('/auth/me', {}, token);
  return mapApiUser(response.user);
};

export const fetchCoreData = async (token: string, role: Role) => {
  const range = availabilityWindow();
  const [
    courts,
    reservations,
    availability,
    payments,
    notifications,
    users,
    feed,
    partners,
    championships,
    achievements,
    reviews,
    ranking,
    settings,
    dashboard
  ] = await Promise.all([
    request<ApiCourt[]>('/courts', {}, token),
    request<ApiReservation[]>(role === 'ADMIN' ? '/reservations' : '/reservations/my', {}, token),
    role === 'CLIENTE'
      ? fetchAvailabilityRangeWithApi(range.start, range.end, token)
      : Promise.resolve<ApiReservationAvailability[]>([]),
    request<ApiPayment[]>(role === 'ADMIN' ? '/payments' : '/payments/my', {}, token),
    request<Record<string, unknown>[]>('/notifications', {}, token),
    role === 'ADMIN' ? request<ApiUser[]>('/users', {}, token) : Promise.resolve<ApiUser[]>([]),
    optionalRequest<ApiCommunityPost[]>('/community/feed', token),
    optionalRequest<ApiPartnerAd[]>('/community/partners', token),
    optionalRequest<ApiChampionship[]>('/community/championships', token),
    optionalRequest<ApiAchievement[]>('/community/achievements/my', token),
    optionalRequest<ApiReview[]>('/community/reviews', token),
    optionalRequest<ApiRankingEntry[]>('/community/ranking', token),
    role === 'ADMIN' ? optionalRequest<ApiSettings>('/settings', token) : Promise.resolve(undefined),
    role === 'ADMIN' ? optionalRequest<ApiAdminDashboard>('/dashboard/admin', token) : Promise.resolve(undefined)
  ]);

  const mappedCourts = courts.map(mapApiCourt);
  const mappedReservations = reservations.map(mapApiReservation);

  return {
    courts: mappedCourts,
    reservations: role === 'CLIENTE'
      ? mergeClientAvailability(mappedReservations, availability, mappedCourts)
      : mappedReservations,
    payments: payments.map(mapApiPayment),
    notifications: notifications.map(mapApiNotification),
    users: users.map(mapApiUser),
    posts: feed?.map(mapApiCommunityPost),
    partnerAds: partners?.map(mapApiPartnerAd),
    championships: championships?.map(mapApiChampionship),
    achievements: achievements?.map(mapApiAchievement),
    reviews: reviews?.map(mapApiReview),
    ranking: ranking?.map(mapApiRankingEntry),
    settings: settings ? mapApiSettings(settings) : undefined,
    activities: dashboard?.activity?.map(mapApiActivity),
    availabilityRange: role === 'CLIENTE' ? range : undefined
  };
};

export const createReservationWithApi = async (input: ReservationFormInput, token: string) => {
  const raw = await request<ApiReservation>('/reservations', {
    method: 'POST',
    body: JSON.stringify({
      clientId: input.clientId ? Number(input.clientId) : null,
      courtId: Number(input.courtId),
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      players: input.players,
      paymentMethod: paymentMethodToApi[input.paymentMethod],
      notes: input.notes
    })
  }, token);
  return mapApiReservation(raw);
};

export const cancelReservationWithApi = async (reservationId: string, token: string) =>
  mapApiReservation(await request<ApiReservation>(`/reservations/${reservationId}/cancel`, { method: 'PUT' }, token));

export const payReservationWithApi = async (reservationId: string, method: PaymentMethod, token: string) =>
  mapApiPayment(await request<ApiPayment>('/payments/demo', {
    method: 'POST',
    body: JSON.stringify({ reservationId: Number(reservationId), method: paymentMethodToApi[method], approve: true })
  }, token));

const courtPayload = (court: Court) => ({
  name: court.name,
  modality: modalityToApi[court.modality],
  description: court.description,
  pricePerHour: court.pricePerHour,
  playerCapacity: court.playerCapacity,
  status: courtStatusToApi[court.status],
  imageUrl: court.image,
  location: court.location,
  lighting: court.lighting,
  covered: court.covered,
  rating: court.rating
});

export const saveCourtWithApi = async (court: Court, token: string) => {
  const editing = /^\d+$/.test(court.id);
  const raw = await request<ApiCourt>(editing ? `/courts/${court.id}` : '/courts', {
    method: editing ? 'PUT' : 'POST',
    body: JSON.stringify(courtPayload(court))
  }, token);
  return mapApiCourt(raw);
};

export const archiveCourtWithApi = async (court: Court, token: string) =>
  saveCourtWithApi({ ...court, status: 'Indisponível' }, token);

const userPayload = (user: User) => ({
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
  city: user.profile.city,
  bio: user.profile.bio,
  favoriteModality: modalityToApi[user.profile.favoriteModality],
  sportsLevel: user.profile.level,
  avatarUrl: /^(https?:|data:)/.test(user.profile.photo) ? user.profile.photo : null,
  ...(user.temporaryPassword ? { password: user.temporaryPassword } : {})
});

export const saveUserWithApi = async (user: User, token: string) => {
  const editing = /^\d+$/.test(user.id);
  const raw = await request<ApiUser>(editing ? `/users/${user.id}` : '/users', {
    method: editing ? 'PUT' : 'POST',
    body: JSON.stringify(userPayload(user))
  }, token);
  return mapApiUser(raw);
};

export const deactivateUserWithApi = async (userId: string, token: string) => {
  await request<void>(`/users/${userId}`, { method: 'DELETE' }, token);
};

export const markNotificationWithApi = async (notificationId: string, token: string) => {
  await request(`/notifications/${notificationId}/read`, { method: 'PUT' }, token);
};

export const clearNotificationsWithApi = async (token: string) => {
  await request('/notifications', { method: 'DELETE' }, token);
};

export const fetchSystemStatus = async (token: string) => request<Record<string, unknown>>('/status', {}, token);

export const likePostWithApi = async (postId: string, token: string) => {
  return mapApiCommunityPost(await request<ApiCommunityPost>(`/community/feed/${postId}/like`, { method: 'POST' }, token));
};

export const enrollInChampionshipWithApi = async (championshipId: string, token: string) => {
  const response = await request<{ message?: string }>(`/community/championships/${championshipId}/enroll`, { method: 'POST' }, token);
  return String(response.message ?? 'Inscrição confirmada.');
};

export const askAiWithApi = async (question: string, token: string) => {
  const normalizedQuestion = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const response = await request<{ answer?: string }>('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ question: normalizedQuestion })
  }, token);
  return String(response.answer ?? 'Não foi possível gerar uma resposta agora.');
};

export const tokenFromStorage = () => {
  try {
    const raw = localStorage.getItem('playspace-session-v2') || localStorage.getItem('playspace-session-v1');
    return raw ? (JSON.parse(raw).token as string | undefined) ?? null : null;
  } catch {
    return null;
  }
};
