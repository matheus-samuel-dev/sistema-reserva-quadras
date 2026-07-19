export type Role = 'ADMIN' | 'CLIENTE';
export type Modality = string;
export type CourtStatus = 'Disponível' | 'Em manutenção' | 'Indisponível';
export type ReservationStatus = 'Pendente' | 'Confirmada' | 'Em andamento' | 'Concluída' | 'Cancelada';
export type PaymentMethod = 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito';
export type PaymentStatus = 'Pendente' | 'Aprovado' | 'Recusado' | 'Cancelado';

export interface ModalityCatalogItem {
  id?: string;
  code: string;
  name: Modality;
  active: boolean;
  defaultPrice: number;
}

export interface UserProfile {
  photo: string;
  bio: string;
  city: string;
  phone?: string;
  availability?: string;
  memberSince: string;
  favoriteModality: Modality;
  sports: Modality[];
  level: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Competitivo';
  reservationsDone: number;
  matchesPlayed: number;
  hoursOnCourt: number;
  attendanceRate: number;
  achievementsUnlocked: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  profile: UserProfile;
  temporaryPassword?: string;
}

export interface Court {
  id: string;
  name: string;
  modality: Modality;
  description: string;
  pricePerHour: number;
  playerCapacity: number;
  status: CourtStatus;
  image: string;
  location: string;
  lighting: boolean;
  covered: boolean;
  rating: number;
  favorite?: boolean;
}

export interface Reservation {
  id: string;
  code: string;
  clientId: string;
  clientName: string;
  courtId: string;
  courtName: string;
  modality: Modality;
  date: string;
  startTime: string;
  endTime: string;
  players: number;
  totalValue: number;
  status: ReservationStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  history: string[];
}

export interface Payment {
  id: string;
  reservationId: string;
  reservationCode: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionCode: string;
  paidAt?: string;
  refundedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  actor: string;
  action: string;
  category: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlockedAt?: string;
  progress: number;
  target: number;
  percent: number;
  createdAt?: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  avatarUrl?: string;
  content: string;
  type: string;
  modality?: Modality;
  likes: number;
  comments: number;
  likedByCurrentUser?: boolean;
  likedByUserIds?: string[];
  commentItems?: CommunityComment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  avatarUrl?: string;
  content: string;
  editable?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PartnerAd {
  id: string;
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  modality: Modality;
  level: string;
  city: string;
  availability: string;
  notes: string;
  createdAt?: string;
}

export interface Championship {
  id: string;
  name: string;
  modality: Modality;
  startDate: string;
  categories: string;
  regulation: string;
  prize: string;
  status: string;
  bracket: string[];
  description?: string;
  courtId?: string;
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
  imageUrl?: string;
  currentUserEnrolled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChampionshipEnrollment {
  id: string;
  championshipId: string;
  championshipName: string;
  playerId: string;
  playerName: string;
  playerAvatarUrl?: string;
  status: 'ATIVA' | 'CANCELADA';
  enrolledAt: string;
  cancelledAt?: string;
}

export type SportsLevel = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' | 'COMPETITIVO';
export type PartnerObjective = 'TREINO' | 'JOGO_CASUAL' | 'COMPETICAO' | 'ENCONTRAR_TIME';
export type PartnerInterestStatus = 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'CANCELADO';
export type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface SportsProfileModality {
  modality: Modality;
  level: SportsLevel;
  primary: boolean;
}

export interface SportsAvailability {
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
}

export interface SportsProfile {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  city: string;
  regions: string[];
  primaryModality: Modality;
  modalities: SportsProfileModality[];
  availabilities: SportsAvailability[];
  objective: PartnerObjective;
  presentation: string;
  position?: string;
  discoverable: boolean;
  currentInterestId?: string;
  currentInterestStatus?: PartnerInterestStatus;
  currentInterestDirection?: 'ENVIADOS' | 'RECEBIDOS';
}

export interface PartnerInterest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl?: string;
  status: PartnerInterestStatus;
  message?: string;
  contactEmail?: string;
  createdAt: string;
  respondedAt?: string;
  cancelledAt?: string;
}

export interface UserPreferences {
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  notificationsEnabled: boolean;
  reservationReminderHours: number;
  emailNotifications: boolean;
  browserNotifications: boolean;
  defaultCity: string;
  favoriteModalities: Modality[];
  preferredTimes: string;
  privateProfile: boolean;
  discoverableByPartners: boolean;
  language: 'pt-BR' | 'en-US' | 'es-ES';
}

export interface Review {
  id: string;
  reservationId?: string;
  userName: string;
  avatarUrl?: string;
  courtName: string;
  cleaning: number;
  lighting: number;
  organization: number;
  service: number;
  courtQuality: number;
  average: number;
  comment: string;
  createdAt?: string;
}

export interface RankingEntry {
  id: string;
  name: string;
  city: string;
  favoriteModality: Modality;
  reservations: number;
  hours: number;
  attendanceRate: number;
  points: number;
  achievements: number;
}

export interface Settings {
  company: string;
  hours: string;
  cancelationRuleHours: number;
  minimumReservationMinutes: number;
  modalities: Modality[];
  defaultPrices: Record<Modality, number>;
  legalName?: string;
  document?: string;
  companyEmail?: string;
  companyPhone?: string;
  address?: string;
  timezone?: string;
  openingTime?: string;
  closingTime?: string;
  operatingDays?: WeekDay[];
  maximumAdvanceDays?: number;
  slotMinutes?: number;
  acceptPix?: boolean;
  acceptCard?: boolean;
  acceptCash?: boolean;
  pixKey?: string;
  emailNotifications?: boolean;
  browserNotifications?: boolean;
  reservationReminderHours?: number;
  primaryColor?: string;
  logoUrl?: string;
  defaultTheme?: 'LIGHT' | 'DARK' | 'SYSTEM';
  minimumPasswordLength?: number;
  sessionMinutes?: number;
  requireStrongPassword?: boolean;
  publicRegistrationEnabled?: boolean;
}

export interface PlaySpaceState {
  modalityCatalog: ModalityCatalogItem[];
  users: User[];
  courts: Court[];
  reservations: Reservation[];
  payments: Payment[];
  notifications: Record<string, NotificationItem[]>;
  activities: Activity[];
  achievements: Record<string, Achievement[]>;
  posts: CommunityPost[];
  partnerAds: PartnerAd[];
  sportsProfiles: SportsProfile[];
  partnerInterests: PartnerInterest[];
  championships: Championship[];
  championshipEnrollments: ChampionshipEnrollment[];
  reviews: Review[];
  ranking: RankingEntry[];
  settings: Settings;
  userPreferences: Record<string, UserPreferences>;
  preferences: {
    theme: 'dark' | 'light';
    favoriteModalities: Modality[];
    favoriteCourts: string[];
    tourDone: boolean;
  };
}

export interface ReservationFormInput {
  clientId?: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  players: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}
