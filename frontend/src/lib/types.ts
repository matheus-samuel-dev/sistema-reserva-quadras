export type Role = 'ADMIN' | 'CLIENTE';
export type Modality = 'Beach Tennis' | 'Futevôlei' | 'Society' | 'Tênis' | 'Vôlei' | 'Basquete';
export type CourtStatus = 'Disponível' | 'Em manutenção' | 'Indisponível';
export type ReservationStatus = 'Pendente' | 'Confirmada' | 'Em andamento' | 'Concluída' | 'Cancelada';
export type PaymentMethod = 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito';
export type PaymentStatus = 'Pendente' | 'Aprovado' | 'Recusado' | 'Cancelado';

export interface UserProfile {
  photo: string;
  bio: string;
  city: string;
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
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  type: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface PartnerAd {
  id: string;
  playerId: string;
  playerName: string;
  modality: Modality;
  level: string;
  city: string;
  availability: string;
  notes: string;
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
}

export interface Review {
  id: string;
  userName: string;
  courtName: string;
  cleaning: number;
  lighting: number;
  organization: number;
  service: number;
  courtQuality: number;
  average: number;
  comment: string;
}

export interface Settings {
  company: string;
  hours: string;
  cancelationRuleHours: number;
  minimumReservationMinutes: number;
  modalities: Modality[];
  defaultPrices: Record<Modality, number>;
}

export interface PlaySpaceState {
  users: User[];
  courts: Court[];
  reservations: Reservation[];
  payments: Payment[];
  notifications: Record<string, NotificationItem[]>;
  activities: Activity[];
  achievements: Record<string, Achievement[]>;
  posts: CommunityPost[];
  partnerAds: PartnerAd[];
  championships: Championship[];
  reviews: Review[];
  settings: Settings;
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
