import type {
  Activity,
  Achievement,
  ChampionshipEnrollment,
  Championship,
  CommunityComment,
  CommunityPost,
  Court,
  CourtStatus,
  Modality,
  ModalityCatalogItem,
  NotificationItem,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PartnerAd,
  PartnerInterest,
  RankingEntry,
  Reservation,
  ReservationFormInput,
  ReservationStatus,
  Role,
  Review,
  Settings,
  SportsProfile,
  UserPreferences,
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

export const apiRequest = request;

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

export type ApiModality = {
  id?: number | string;
  code: string;
  name: string;
  active: boolean;
  defaultPrice: number;
};

let modalityCatalogByCode = new Map<string, ModalityCatalogItem>();
let modalityCodeByName = new Map<string, string>();

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

const reservationStatusToApi: Record<ReservationStatus, string> = {
  Pendente: 'PENDENTE',
  Confirmada: 'CONFIRMADA',
  'Em andamento': 'EM_ANDAMENTO',
  Concluída: 'CONCLUIDA',
  Cancelada: 'CANCELADA'
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

const normalizedModalityKey = (value: string) => value
  .normalize('NFKC')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('pt-BR');

const humanizeModality = (value: string) => value
  .replace(/[_-]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('pt-BR')
  .split(' ')
  .map((word, index) => index > 0 && ['da', 'das', 'de', 'do', 'dos', 'e'].includes(word)
    ? word
    : word[0]?.toLocaleUpperCase('pt-BR') + word.slice(1))
  .join(' ');

export const setApiModalityCatalog = (items: ApiModality[]): ModalityCatalogItem[] => {
  const mapped = items.map((item): ModalityCatalogItem => ({
    id: item.id == null ? undefined : String(item.id),
    code: String(item.code).trim().toUpperCase(),
    name: String(item.name).normalize('NFKC').trim() as Modality,
    active: item.active !== false,
    defaultPrice: Number(item.defaultPrice ?? 0)
  }));
  modalityCatalogByCode = new Map(mapped.map((item) => [item.code, item]));
  modalityCodeByName = new Map(mapped.map((item) => [normalizedModalityKey(item.name), item.code]));
  return mapped;
};

const pickModality = (value?: string | null): Modality => {
  const raw = value?.normalize('NFKC').trim() ?? '';
  if (!raw) return '';
  const canonicalCode = raw.toUpperCase();
  const byCode = modalityCatalogByCode.get(canonicalCode);
  if (byCode) return byCode.name;
  const codeByName = modalityCodeByName.get(normalizedModalityKey(raw));
  if (codeByName) return modalityCatalogByCode.get(codeByName)?.name ?? humanizeModality(raw);
  return humanizeModality(raw) as Modality;
};

const modalityToApiValue = (value: Modality): string => {
  const raw = String(value ?? '').normalize('NFKC').trim();
  const directCode = raw.toUpperCase();
  if (modalityCatalogByCode.has(directCode)) return directCode;
  const code = modalityCodeByName.get(normalizedModalityKey(raw));
  if (code) return code;
  throw new ApiRequestError('Selecione uma modalidade cadastrada no catálogo.', 400);
};

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

type ApiPaymentRefund = {
  paymentId: number | string;
  reservationId: number | string;
  reservationCode: string;
  reservationStatus: string;
  method: string;
  status: string;
  amount: number;
  transactionCode: string;
  paidAt?: string | null;
  refundedAt: string;
};

export type PaymentRefundResult = {
  payment: Payment;
  reservationStatus: ReservationStatus;
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
  modality?: string | null;
  likes: number;
  comments: number;
  likedByCurrentUser?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type ApiCommunityComment = {
  id: number | string;
  postId: number | string;
  authorId: number | string;
  authorName: string;
  avatarUrl?: string | null;
  content: string;
  editable?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type ApiPage<T> = {
  content: T[];
  page?: number;
  number?: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
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
  categories?: string;
  prize: string;
  status: string;
  regulation: string;
  bracket: string[] | string;
  createdAt: string;
  description?: string;
  courtId?: number | string;
  courtName?: string;
  location?: string;
  city?: string;
  endDate?: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  enrolledParticipants?: number;
  availableSpots?: number;
  format?: string;
  registrationFee?: number;
  imageUrl?: string | null;
  currentUserEnrolled?: boolean;
  updatedAt?: string;
};

export type ApiChampionshipEnrollment = {
  id: number | string;
  championshipId: number | string;
  championshipName: string;
  playerId: number | string;
  playerName: string;
  playerAvatarUrl?: string | null;
  status: 'ATIVA' | 'CANCELADA';
  enrolledAt: string;
  cancelledAt?: string | null;
};

export type ApiSportsProfile = {
  id: number | string;
  userId: number | string;
  name: string;
  avatarUrl?: string | null;
  city: string;
  regions?: string[];
  primaryModality: string;
  modalities: Array<{ modality: string; level: SportsProfile['modalities'][number]['level']; primary: boolean }>;
  availabilities: Array<{ dayOfWeek: SportsProfile['availabilities'][number]['dayOfWeek']; startTime: string; endTime: string }>;
  objective: SportsProfile['objective'];
  presentation: string;
  position?: string | null;
  discoverable: boolean;
  currentInterestId?: number | string | null;
  currentInterestStatus?: PartnerInterest['status'] | null;
  currentInterestDirection?: 'ENVIADOS' | 'RECEBIDOS' | null;
};

export type ApiPartnerInterest = {
  id: number | string;
  senderId: number | string;
  senderName: string;
  senderAvatarUrl?: string | null;
  receiverId: number | string;
  receiverName: string;
  receiverAvatarUrl?: string | null;
  status: PartnerInterest['status'];
  message?: string | null;
  contactEmail?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  cancelledAt?: string | null;
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
  reservationId?: number | string | null;
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
  points?: number;
  achievements?: number;
};

type ApiSettings = {
  company?: string;
  legalName?: string;
  document?: string;
  companyEmail?: string;
  companyPhone?: string;
  address?: string;
  timezone?: string;
  openingTime?: string;
  closingTime?: string;
  hours?: string;
  operatingDays?: Settings['operatingDays'];
  cancelationRuleHours?: number;
  minimumReservationMinutes?: number;
  maximumAdvanceDays?: number;
  slotMinutes?: number;
  modalities?: string[];
  defaultPrices?: Record<string, number>;
  acceptPix?: boolean;
  acceptCard?: boolean;
  acceptCash?: boolean;
  pixKey?: string;
  emailNotifications?: boolean;
  browserNotifications?: boolean;
  reservationReminderHours?: number;
  primaryColor?: string;
  logoUrl?: string;
  defaultTheme?: Settings['defaultTheme'];
  minimumPasswordLength?: number;
  sessionMinutes?: number;
  requireStrongPassword?: boolean;
  publicRegistrationEnabled?: boolean;
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
      phone: raw.phone ? String(raw.phone) : '',
      availability: raw.availability ? String(raw.availability) : '',
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
        modality: court?.modality ?? '',
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
  paidAt: raw.paidAt ? String(raw.paidAt) : undefined,
  refundedAt: raw.refundedAt ? String(raw.refundedAt) : undefined
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
  modality: raw.modality ? pickModality(String(raw.modality)) : undefined,
  likes: Number(raw.likes ?? 0),
  comments: Number(raw.comments ?? 0),
  likedByCurrentUser: Boolean(raw.likedByCurrentUser),
  createdAt: String(raw.createdAt ?? new Date().toISOString()),
  updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined
});

export const mapApiCommunityComment = (raw: ApiCommunityComment): CommunityComment => ({
  id: String(raw.id),
  postId: String(raw.postId),
  authorId: String(raw.authorId),
  authorName: String(raw.authorName ?? 'Jogador PlaySpace'),
  avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
  content: String(raw.content ?? ''),
  editable: Boolean(raw.editable),
  createdAt: String(raw.createdAt ?? new Date().toISOString()),
  updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined
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
  bracket: Array.isArray(raw.bracket)
    ? raw.bracket.map(String)
    : String(raw.bracket ?? '').split(/\r?\n|→/).map((item) => item.trim()).filter(Boolean),
  description: String(raw.description ?? ''),
  courtId: raw.courtId == null ? undefined : String(raw.courtId),
  courtName: raw.courtName ? String(raw.courtName) : undefined,
  location: raw.location ? String(raw.location) : undefined,
  city: raw.city ? String(raw.city) : undefined,
  endDate: raw.endDate ? String(raw.endDate) : undefined,
  registrationDeadline: raw.registrationDeadline ? String(raw.registrationDeadline) : undefined,
  maxParticipants: raw.maxParticipants == null ? undefined : Number(raw.maxParticipants),
  enrolledParticipants: raw.enrolledParticipants == null ? undefined : Number(raw.enrolledParticipants),
  availableSpots: raw.availableSpots == null ? undefined : Number(raw.availableSpots),
  format: raw.format ? String(raw.format) : undefined,
  registrationFee: raw.registrationFee == null ? undefined : Number(raw.registrationFee),
  imageUrl: raw.imageUrl ? String(raw.imageUrl) : undefined,
  currentUserEnrolled: Boolean(raw.currentUserEnrolled),
  createdAt: String(raw.createdAt ?? new Date().toISOString()),
  updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined
});

export const mapApiChampionshipEnrollment = (raw: ApiChampionshipEnrollment): ChampionshipEnrollment => ({
  id: String(raw.id),
  championshipId: String(raw.championshipId),
  championshipName: String(raw.championshipName),
  playerId: String(raw.playerId),
  playerName: String(raw.playerName),
  playerAvatarUrl: raw.playerAvatarUrl ? String(raw.playerAvatarUrl) : undefined,
  status: raw.status,
  enrolledAt: String(raw.enrolledAt),
  cancelledAt: raw.cancelledAt ? String(raw.cancelledAt) : undefined
});

export const mapApiSportsProfile = (raw: ApiSportsProfile): SportsProfile => ({
  id: String(raw.id),
  userId: String(raw.userId),
  name: String(raw.name),
  avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
  city: String(raw.city ?? ''),
  regions: Array.isArray(raw.regions) ? raw.regions.map(String) : [],
  primaryModality: pickModality(raw.primaryModality),
  modalities: (raw.modalities ?? []).map((item) => ({ modality: pickModality(item.modality), level: item.level, primary: Boolean(item.primary) })),
  availabilities: (raw.availabilities ?? []).map((item) => ({ dayOfWeek: item.dayOfWeek, startTime: String(item.startTime).slice(0, 5), endTime: String(item.endTime).slice(0, 5) })),
  objective: raw.objective,
  presentation: String(raw.presentation ?? ''),
  position: raw.position ? String(raw.position) : undefined,
  discoverable: Boolean(raw.discoverable),
  currentInterestId: raw.currentInterestId == null ? undefined : String(raw.currentInterestId),
  currentInterestStatus: raw.currentInterestStatus ?? undefined,
  currentInterestDirection: raw.currentInterestDirection ?? undefined
});

export const mapApiPartnerInterest = (raw: ApiPartnerInterest): PartnerInterest => ({
  id: String(raw.id),
  senderId: String(raw.senderId),
  senderName: String(raw.senderName),
  senderAvatarUrl: raw.senderAvatarUrl ? String(raw.senderAvatarUrl) : undefined,
  receiverId: String(raw.receiverId),
  receiverName: String(raw.receiverName),
  receiverAvatarUrl: raw.receiverAvatarUrl ? String(raw.receiverAvatarUrl) : undefined,
  status: raw.status,
  message: raw.message ? String(raw.message) : undefined,
  contactEmail: raw.contactEmail ? String(raw.contactEmail) : undefined,
  createdAt: String(raw.createdAt),
  respondedAt: raw.respondedAt ? String(raw.respondedAt) : undefined,
  cancelledAt: raw.cancelledAt ? String(raw.cancelledAt) : undefined
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
  reservationId: raw.reservationId == null ? undefined : String(raw.reservationId),
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
  attendanceRate: Number(raw.attendanceRate ?? 0),
  points: Number(raw.points ?? 0),
  achievements: Number(raw.achievements ?? 0)
});

export const fetchRankingWithApi = async (period: 'WEEKLY' | 'MONTHLY' | 'ANNUAL', modality: Modality | 'Todas', token: string) => {
  const parameters = new URLSearchParams({ period });
  if (modality !== 'Todas') parameters.set('modality', modalityToApiValue(modality));
  const response = await request<ApiRankingEntry[]>(`/community/ranking?${parameters.toString()}`, {}, token);
  return response.map(mapApiRankingEntry);
};

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
    legalName: String(raw.legalName ?? ''),
    document: String(raw.document ?? ''),
    companyEmail: String(raw.companyEmail ?? ''),
    companyPhone: String(raw.companyPhone ?? ''),
    address: String(raw.address ?? ''),
    timezone: String(raw.timezone ?? 'America/Sao_Paulo'),
    openingTime: String(raw.openingTime ?? '08:00').slice(0, 5),
    closingTime: String(raw.closingTime ?? '22:00').slice(0, 5),
    hours: String(raw.hours ?? '08:00 - 22:00'),
    operatingDays: raw.operatingDays ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    cancelationRuleHours: Number(raw.cancelationRuleHours ?? 2),
    minimumReservationMinutes: Number(raw.minimumReservationMinutes ?? 60),
    maximumAdvanceDays: Number(raw.maximumAdvanceDays ?? 90),
    slotMinutes: Number(raw.slotMinutes ?? 60),
    modalities: modalities.length
      ? modalities
      : [...modalityCatalogByCode.values()].filter((item) => item.active).map((item) => item.name),
    defaultPrices: Object.fromEntries(
      [...modalityCatalogByCode.values()].map((item) => [
        item.name,
        defaultPrices[item.name] ?? item.defaultPrice
      ])
    ) as Record<Modality, number>,
    acceptPix: raw.acceptPix !== false,
    acceptCard: raw.acceptCard !== false,
    acceptCash: Boolean(raw.acceptCash),
    pixKey: String(raw.pixKey ?? ''),
    emailNotifications: raw.emailNotifications !== false,
    browserNotifications: raw.browserNotifications !== false,
    reservationReminderHours: Number(raw.reservationReminderHours ?? 2),
    primaryColor: String(raw.primaryColor ?? '#0F766E'),
    logoUrl: String(raw.logoUrl ?? ''),
    defaultTheme: raw.defaultTheme ?? 'SYSTEM',
    minimumPasswordLength: Number(raw.minimumPasswordLength ?? 8),
    sessionMinutes: Number(raw.sessionMinutes ?? 120),
    requireStrongPassword: raw.requireStrongPassword !== false,
    publicRegistrationEnabled: raw.publicRegistrationEnabled !== false
  };
};

export const fetchModalitiesWithApi = async (token: string, includeInactive = true) => {
  const query = includeInactive ? '?includeInactive=true' : '';
  return setApiModalityCatalog(await request<ApiModality[]>(`/modalities${query}`, {}, token));
};

export const createModalityWithApi = async (name: string, defaultPrice: number, token: string) => {
  const created = await request<ApiModality>('/modalities', {
    method: 'POST',
    body: JSON.stringify({ name, defaultPrice })
  }, token);
  const existing = [...modalityCatalogByCode.values()].map((item): ApiModality => ({
    id: item.id,
    code: item.code,
    name: item.name,
    active: item.active,
    defaultPrice: item.defaultPrice
  }));
  return setApiModalityCatalog([...existing.filter((item) => item.code !== created.code), created])
    .find((item) => item.code === created.code)!;
};

export const loginWithApi = async (email: string, password: string) => {
  const response = await request<{ token: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  await fetchModalitiesWithApi(response.token, true);
  return { token: response.token, user: mapApiUser(response.user) };
};

export const getCurrentUser = async (token: string) => {
  const response = await request<{ user: ApiUser }>('/auth/me', {}, token);
  await fetchModalitiesWithApi(token, true);
  return mapApiUser(response.user);
};

export const fetchCoreData = async (token: string, role: Role) => {
  const range = availabilityWindow();
  const communityFeed = async () => {
    const page = await optionalRequest<ApiPage<ApiCommunityPost>>('/community/posts?size=50', token);
    if (Array.isArray(page?.content)) return page.content;
    return optionalRequest<ApiCommunityPost[]>('/community/feed', token);
  };
  const championshipFeed = async () => {
    const page = await optionalRequest<ApiPage<ApiChampionship>>('/championships?size=50', token);
    if (Array.isArray(page?.content)) return page.content;
    return optionalRequest<ApiChampionship[]>('/community/championships', token);
  };
  const [
    modalityCatalog,
    courts,
    reservations,
    availability,
    payments,
    notifications,
    users,
    feed,
    legacyPartners,
    championships,
    sportsProfilePage,
    mySportsProfile,
    receivedInterests,
    sentInterests,
    enrollmentPage,
    preferences,
    achievements,
    reviews,
    ranking,
    settings,
    dashboard
  ] = await Promise.all([
    request<ApiModality[]>('/modalities?includeInactive=true', {}, token),
    request<ApiCourt[]>('/courts', {}, token),
    request<ApiReservation[]>(role === 'ADMIN' ? '/reservations' : '/reservations/my', {}, token),
    role === 'CLIENTE'
      ? fetchAvailabilityRangeWithApi(range.start, range.end, token)
      : Promise.resolve<ApiReservationAvailability[]>([]),
    request<ApiPayment[]>(role === 'ADMIN' ? '/payments' : '/payments/my', {}, token),
    request<Record<string, unknown>[]>('/notifications', {}, token),
    role === 'ADMIN' ? request<ApiUser[]>('/users', {}, token) : Promise.resolve<ApiUser[]>([]),
    communityFeed(),
    optionalRequest<ApiPartnerAd[]>('/community/partners', token),
    championshipFeed(),
    role === 'CLIENTE' ? optionalRequest<ApiPage<ApiSportsProfile>>('/partners?size=50', token) : Promise.resolve(undefined),
    role === 'CLIENTE' ? optionalRequest<ApiSportsProfile>('/partners/profiles/me', token) : Promise.resolve(undefined),
    role === 'CLIENTE' ? optionalRequest<ApiPage<ApiPartnerInterest>>('/partner-interests?direction=RECEBIDOS&size=100', token) : Promise.resolve(undefined),
    role === 'CLIENTE' ? optionalRequest<ApiPage<ApiPartnerInterest>>('/partner-interests?direction=ENVIADOS&size=100', token) : Promise.resolve(undefined),
    role === 'CLIENTE' ? optionalRequest<ApiPage<ApiChampionshipEnrollment>>('/championships/enrollments/my?size=100', token) : Promise.resolve(undefined),
    optionalRequest<Record<string, unknown>>('/profile/preferences', token),
    optionalRequest<ApiAchievement[]>('/community/achievements/my', token),
    optionalRequest<ApiReview[]>('/community/reviews', token),
    optionalRequest<ApiRankingEntry[]>('/community/ranking', token),
    role === 'ADMIN' ? optionalRequest<ApiSettings>('/settings', token) : Promise.resolve(undefined),
    role === 'ADMIN' ? optionalRequest<ApiAdminDashboard>('/dashboard/admin', token) : Promise.resolve(undefined)
  ]);

  const mappedModalityCatalog = setApiModalityCatalog(modalityCatalog);
  const mappedCourts = courts.map(mapApiCourt);
  const mappedReservations = reservations.map(mapApiReservation);

  return {
    modalityCatalog: mappedModalityCatalog,
    courts: mappedCourts,
    reservations: role === 'CLIENTE'
      ? mergeClientAvailability(mappedReservations, availability, mappedCourts)
      : mappedReservations,
    payments: payments.map(mapApiPayment),
    notifications: notifications.map(mapApiNotification),
    users: users.map(mapApiUser),
    posts: feed?.map(mapApiCommunityPost),
    partnerAds: legacyPartners?.map(mapApiPartnerAd),
    championships: championships?.map(mapApiChampionship),
    sportsProfiles: sportsProfilePage
      ? [...(mySportsProfile ? [mapApiSportsProfile(mySportsProfile)] : []), ...sportsProfilePage.content.map(mapApiSportsProfile)]
      : undefined,
    partnerInterests: receivedInterests || sentInterests
      ? [...new Map([...(receivedInterests?.content ?? []), ...(sentInterests?.content ?? [])]
          .map((item) => [String(item.id), mapApiPartnerInterest(item)])).values()]
      : undefined,
    championshipEnrollments: enrollmentPage?.content.map(mapApiChampionshipEnrollment),
    preferences: preferences ? mapApiPreferences(preferences) : undefined,
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

export const changeReservationStatusWithApi = async (reservationId: string, status: ReservationStatus, token: string) =>
  mapApiReservation(await request<ApiReservation>(`/reservations/${reservationId}/status/${reservationStatusToApi[status]}`, { method: 'PUT' }, token));

export const payReservationWithApi = async (reservationId: string, method: PaymentMethod, token: string) =>
  mapApiPayment(await request<ApiPayment>('/payments/demo', {
    method: 'POST',
    body: JSON.stringify({ reservationId: Number(reservationId), method: paymentMethodToApi[method], approve: true })
  }, token));

export const refundPaymentWithApi = async (paymentId: string, token: string): Promise<PaymentRefundResult> => {
  const raw = await request<ApiPaymentRefund>(`/payments/${paymentId}/refund`, { method: 'POST' }, token);
  return {
    payment: {
      id: String(raw.paymentId),
      reservationId: String(raw.reservationId),
      reservationCode: raw.reservationCode,
      method: paymentMethodFromApi[raw.method] ?? 'PIX',
      status: paymentStatusFromApi[raw.status] ?? 'Cancelado',
      amount: Number(raw.amount),
      transactionCode: raw.transactionCode,
      paidAt: raw.paidAt ?? undefined,
      refundedAt: raw.refundedAt
    },
    reservationStatus: reservationStatusFromApi[raw.reservationStatus] ?? 'Cancelada'
  };
};

const courtPayload = (court: Court) => ({
  name: court.name,
  modality: modalityToApiValue(court.modality),
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
  favoriteModality: modalityToApiValue(user.profile.favoriteModality),
  sportsLevel: user.profile.level,
  avatarUrl: /^(https?:|data:)/.test(user.profile.photo) ? user.profile.photo : null,
  phone: user.profile.phone || null,
  availability: user.profile.availability || null,
  practicedSports: user.profile.sports.map((item) => modalityToApiValue(item)),
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

export const fetchCommunityPostsWithApi = async (token: string, page = 0, size = 20) => {
  const response = await request<ApiPage<ApiCommunityPost>>(`/community/posts?page=${page}&size=${size}`, {}, token);
  return { ...response, content: response.content.map(mapApiCommunityPost) };
};

export const createCommunityPostWithApi = async (
  input: Pick<CommunityPost, 'content' | 'type' | 'modality'>,
  token: string
) => mapApiCommunityPost(await request<ApiCommunityPost>('/community/posts', {
  method: 'POST',
  body: JSON.stringify({ content: input.content, type: input.type, modality: input.modality ? modalityToApiValue(input.modality) : null })
}, token));

export const updateCommunityPostWithApi = async (
  postId: string,
  input: Pick<CommunityPost, 'content' | 'type' | 'modality'>,
  token: string
) => mapApiCommunityPost(await request<ApiCommunityPost>(`/community/posts/${postId}`, {
  method: 'PUT',
  body: JSON.stringify({ content: input.content, type: input.type, modality: input.modality ? modalityToApiValue(input.modality) : null })
}, token));

export const deleteCommunityPostWithApi = (postId: string, token: string) =>
  request<void>(`/community/posts/${postId}`, { method: 'DELETE' }, token);

export const toggleCommunityLikeWithApi = async (postId: string, liked: boolean, token: string) =>
  mapApiCommunityPost(await request<ApiCommunityPost>(`/community/posts/${postId}/likes`, { method: liked ? 'DELETE' : 'POST' }, token));

export const fetchCommunityCommentsWithApi = async (postId: string, token: string, page = 0, size = 50) => {
  const response = await request<ApiPage<ApiCommunityComment>>(`/community/posts/${postId}/comments?page=${page}&size=${size}`, {}, token);
  return { ...response, content: response.content.map(mapApiCommunityComment) };
};

export const createCommunityCommentWithApi = async (postId: string, content: string, token: string) =>
  mapApiCommunityComment(await request<ApiCommunityComment>(`/community/posts/${postId}/comments`, {
    method: 'POST', body: JSON.stringify({ content })
  }, token));

export const updateCommunityCommentWithApi = async (commentId: string, content: string, token: string) =>
  mapApiCommunityComment(await request<ApiCommunityComment>(`/community/comments/${commentId}`, {
    method: 'PUT', body: JSON.stringify({ content })
  }, token));

export const deleteCommunityCommentWithApi = (commentId: string, token: string) =>
  request<void>(`/community/comments/${commentId}`, { method: 'DELETE' }, token);

export const createReviewWithApi = async (
  input: {
    reservationId: string;
    cleaning: number;
    lighting: number;
    organization: number;
    service: number;
    courtQuality: number;
    comment: string;
  },
  token: string
) => mapApiReview(await request<ApiReview>('/community/reviews', {
  method: 'POST',
  body: JSON.stringify({ ...input, reservationId: Number(input.reservationId) })
}, token));

export const fetchChampionshipsWithApi = async (token: string, page = 0, size = 50) => {
  const response = await request<ApiPage<ApiChampionship>>(`/championships?page=${page}&size=${size}`, {}, token);
  return { ...response, content: response.content.map(mapApiChampionship) };
};

const championshipPayload = (item: Championship) => ({
  name: item.name,
  description: item.description,
  modality: modalityToApiValue(item.modality),
  courtId: Number(item.courtId),
  location: item.location,
  city: item.city,
  startDate: item.startDate,
  endDate: item.endDate,
  registrationDeadline: item.registrationDeadline,
  maxParticipants: item.maxParticipants,
  format: item.format,
  prize: item.prize,
  registrationFee: item.registrationFee ?? 0,
  regulation: item.regulation,
  imageUrl: item.imageUrl || null,
  bracket: item.bracket.join('\n'),
  initialStatus: item.status
});

export const saveChampionshipWithApi = async (item: Championship, token: string) => {
  const editing = /^\d+$/.test(item.id);
  return mapApiChampionship(await request<ApiChampionship>(editing ? `/championships/${item.id}` : '/championships', {
    method: editing ? 'PUT' : 'POST', body: JSON.stringify(championshipPayload(item))
  }, token));
};

export const changeChampionshipStatusWithApi = async (id: string, status: string, token: string) =>
  mapApiChampionship(await request<ApiChampionship>(`/championships/${id}/status`, {
    method: 'PATCH', body: JSON.stringify({ status })
  }, token));

export const deleteChampionshipWithApi = (id: string, token: string) =>
  request<void>(`/championships/${id}`, { method: 'DELETE' }, token);

export const enrollChampionshipWithApi = async (id: string, token: string) =>
  mapApiChampionshipEnrollment(await request<ApiChampionshipEnrollment>(`/championships/${id}/enrollments`, { method: 'POST' }, token));

export const cancelChampionshipEnrollmentWithApi = (id: string, token: string) =>
  request<void>(`/championships/${id}/enrollments/my`, { method: 'DELETE' }, token);

export const fetchChampionshipParticipantsWithApi = async (id: string, token: string) => {
  const response = await request<ApiPage<ApiChampionshipEnrollment>>(`/championships/${id}/participants?size=100`, {}, token);
  return response.content.map(mapApiChampionshipEnrollment);
};

export const fetchSportsProfilesWithApi = async (token: string) => {
  const response = await request<ApiPage<ApiSportsProfile>>('/partners?size=50', {}, token);
  return response.content.map(mapApiSportsProfile);
};

export const fetchMySportsProfileWithApi = async (token: string) =>
  mapApiSportsProfile(await request<ApiSportsProfile>('/partners/profiles/me', {}, token));

export const saveSportsProfileWithApi = async (profile: SportsProfile, token: string) =>
  mapApiSportsProfile(await request<ApiSportsProfile>('/partners/profiles/me', {
    method: 'PUT',
    body: JSON.stringify({
      city: profile.city,
      regions: profile.regions,
      primaryModality: modalityToApiValue(profile.primaryModality),
      modalities: profile.modalities.map((item) => ({ modality: modalityToApiValue(item.modality), level: item.level })),
      availabilities: profile.availabilities,
      objective: profile.objective,
      presentation: profile.presentation,
      position: profile.position || null,
      discoverable: profile.discoverable,
      avatarUrl: profile.avatarUrl || null
    })
  }, token));

export const fetchPartnerInterestsWithApi = async (token: string) => {
  const [received, sent] = await Promise.all([
    request<ApiPage<ApiPartnerInterest>>('/partner-interests?direction=RECEBIDOS&size=100', {}, token),
    request<ApiPage<ApiPartnerInterest>>('/partner-interests?direction=ENVIADOS&size=100', {}, token)
  ]);
  const unique = new Map([...received.content, ...sent.content].map((item) => [String(item.id), mapApiPartnerInterest(item)]));
  return [...unique.values()];
};

export const sendPartnerInterestWithApi = async (userId: string, message: string, token: string) =>
  mapApiPartnerInterest(await request<ApiPartnerInterest>(`/partners/${userId}/interests`, {
    method: 'POST', body: JSON.stringify({ message })
  }, token));

export const respondPartnerInterestWithApi = async (id: string, accept: boolean, token: string) =>
  mapApiPartnerInterest(await request<ApiPartnerInterest>(`/partner-interests/${id}/${accept ? 'accept' : 'refuse'}`, { method: 'PATCH' }, token));

export const cancelPartnerInterestWithApi = (id: string, token: string) =>
  request<void>(`/partner-interests/${id}`, { method: 'DELETE' }, token);

export const saveProfileWithApi = async (user: User, token: string) => mapApiUser(await request<ApiUser>('/profile', {
  method: 'PUT',
  body: JSON.stringify({
    name: user.name,
    phone: user.profile.phone || null,
    city: user.profile.city || null,
    avatarUrl: /^(https?:|data:)/.test(user.profile.photo) ? user.profile.photo : null,
    bio: user.profile.bio || null,
    sportsLevel: user.profile.level,
    favoriteModality: modalityToApiValue(user.profile.favoriteModality),
    practicedSports: user.profile.sports.map((item) => modalityToApiValue(item)),
    availability: user.profile.availability || null
  })
}, token));

export const removeProfileAvatarWithApi = async (token: string) =>
  mapApiUser(await request<ApiUser>('/profile/avatar', { method: 'DELETE' }, token));

export const changePasswordWithApi = (currentPassword: string, newPassword: string, confirmation: string, token: string) =>
  request<void>('/profile/password', {
    method: 'PUT', body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirmation: confirmation })
  }, token);

export const mapApiPreferences = (raw: Record<string, unknown>): UserPreferences => ({
  theme: String(raw.theme ?? 'SYSTEM') as UserPreferences['theme'],
  notificationsEnabled: raw.notificationsEnabled !== false,
  reservationReminderHours: Number(raw.reservationReminderHours ?? 2),
  emailNotifications: raw.emailNotifications !== false,
  browserNotifications: raw.browserNotifications !== false,
  defaultCity: String(raw.defaultCity ?? ''),
  favoriteModalities: Array.isArray(raw.favoriteModalities) ? raw.favoriteModalities.map((item) => pickModality(String(item))) : [],
  preferredTimes: String(raw.preferredTimes ?? ''),
  privateProfile: Boolean(raw.privateProfile),
  discoverableByPartners: raw.discoverableByPartners !== false,
  language: String(raw.language ?? 'pt-BR') as UserPreferences['language']
});

export const fetchPreferencesWithApi = async (token: string) =>
  mapApiPreferences(await request<Record<string, unknown>>('/profile/preferences', {}, token));

export const savePreferencesWithApi = async (preferences: UserPreferences, token: string) =>
  mapApiPreferences(await request<Record<string, unknown>>('/profile/preferences', {
    method: 'PUT',
    body: JSON.stringify({ ...preferences, favoriteModalities: preferences.favoriteModalities.map((item) => modalityToApiValue(item)) })
  }, token));

const settingsPayload = (value: Settings) => ({
  company: value.company,
  legalName: value.legalName || null,
  document: value.document || null,
  companyEmail: value.companyEmail || null,
  companyPhone: value.companyPhone || null,
  address: value.address || null,
  timezone: value.timezone ?? 'America/Sao_Paulo',
  openingTime: value.openingTime ?? value.hours.split(' - ')[0],
  closingTime: value.closingTime ?? value.hours.split(' - ')[1],
  operatingDays: value.operatingDays,
  cancelationRuleHours: value.cancelationRuleHours,
  minimumReservationMinutes: value.minimumReservationMinutes,
  maximumAdvanceDays: value.maximumAdvanceDays,
  slotMinutes: value.slotMinutes,
  modalities: value.modalities.map((item) => modalityToApiValue(item)),
  defaultPrices: Object.fromEntries(Object.entries(value.defaultPrices).map(([key, price]) => [modalityToApiValue(key as Modality), price])),
  acceptPix: value.acceptPix,
  acceptCard: value.acceptCard,
  acceptCash: value.acceptCash,
  pixKey: value.pixKey || null,
  emailNotifications: value.emailNotifications,
  browserNotifications: value.browserNotifications,
  reservationReminderHours: value.reservationReminderHours,
  primaryColor: value.primaryColor,
  logoUrl: value.logoUrl || null,
  defaultTheme: value.defaultTheme,
  minimumPasswordLength: value.minimumPasswordLength,
  sessionMinutes: value.sessionMinutes,
  requireStrongPassword: value.requireStrongPassword,
  publicRegistrationEnabled: value.publicRegistrationEnabled
});

export const saveSettingsWithApi = async (value: Settings, token: string) => {
  const raw = await request<ApiSettings>('/settings', { method: 'PUT', body: JSON.stringify(settingsPayload(value)) }, token);
  const modalityCatalog = await fetchModalitiesWithApi(token, true);
  return { settings: mapApiSettings(raw), modalityCatalog };
};

export const registerWithApi = async (input: { name: string; email: string; password: string; confirmation: string; phone?: string }) => {
  const response = await request<{ token: string; user: ApiUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
      passwordConfirmation: input.confirmation,
      phone: input.phone || null,
      acceptedTerms: true
    })
  });
  await fetchModalitiesWithApi(response.token, true);
  return { token: response.token, user: mapApiUser(response.user) };
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
