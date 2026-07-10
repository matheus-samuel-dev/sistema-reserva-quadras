import type {
  Achievement,
  Activity,
  Championship,
  CommunityPost,
  Court,
  NotificationItem,
  PartnerAd,
  Payment,
  PlaySpaceState,
  Reservation,
  Review,
  Settings,
  User
} from './types';

const isoDate = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();

export const demoCredentials = {
  'admin@playspace.com': 'Admin@123',
  'cliente@playspace.com': 'Cliente@123'
};

export const users: User[] = [
  {
    id: 'u-admin',
    name: 'Matheus Santos',
    email: 'admin@playspace.com',
    role: 'ADMIN',
    active: true,
    profile: {
      photo: 'MS',
      bio: 'Administrador PlaySpace focado em operação, comunidade e alta ocupação das quadras.',
      city: 'São Paulo',
      memberSince: '2025-02-14',
      favoriteModality: 'Beach Tennis',
      sports: ['Beach Tennis', 'Society'],
      level: 'Competitivo',
      reservationsDone: 0,
      matchesPlayed: 0,
      hoursOnCourt: 0,
      attendanceRate: 100,
      achievementsUnlocked: 0
    }
  },
  {
    id: 'u-cliente',
    name: 'Marina Costa',
    email: 'cliente@playspace.com',
    role: 'CLIENTE',
    active: true,
    profile: {
      photo: 'MC',
      bio: 'Joga Beach Tennis à noite, procura bons parceiros e acompanha evolução semanal.',
      city: 'São Paulo',
      memberSince: '2025-08-02',
      favoriteModality: 'Beach Tennis',
      sports: ['Beach Tennis', 'Futevôlei', 'Tênis'],
      level: 'Intermediário',
      reservationsDone: 27,
      matchesPlayed: 54,
      hoursOnCourt: 86,
      attendanceRate: 96,
      achievementsUnlocked: 7
    }
  },
  {
    id: 'u-lucas',
    name: 'Lucas Alves',
    email: 'lucas@playspace.com',
    role: 'CLIENTE',
    active: true,
    profile: {
      photo: 'LA',
      bio: 'Capitão de society, competitivo e fã dos horários de pico.',
      city: 'Campinas',
      memberSince: '2025-04-18',
      favoriteModality: 'Society',
      sports: ['Society', 'Basquete'],
      level: 'Avançado',
      reservationsDone: 34,
      matchesPlayed: 61,
      hoursOnCourt: 104,
      attendanceRate: 93,
      achievementsUnlocked: 8
    }
  },
  {
    id: 'u-carlos',
    name: 'Carlos Nunes',
    email: 'carlos@playspace.com',
    role: 'CLIENTE',
    active: true,
    profile: {
      photo: 'CN',
      bio: 'Futevôlei, treinos rápidos e jogos de fim de tarde.',
      city: 'Santos',
      memberSince: '2025-06-10',
      favoriteModality: 'Futevôlei',
      sports: ['Futevôlei', 'Beach Tennis'],
      level: 'Intermediário',
      reservationsDone: 22,
      matchesPlayed: 39,
      hoursOnCourt: 72,
      attendanceRate: 91,
      achievementsUnlocked: 5
    }
  },
  {
    id: 'u-bia',
    name: 'Beatriz Lima',
    email: 'bia@playspace.com',
    role: 'CLIENTE',
    active: true,
    profile: {
      photo: 'BL',
      bio: 'Tênis iniciante, gosta de aulas pela manhã e quadras cobertas.',
      city: 'São Paulo',
      memberSince: '2026-01-20',
      favoriteModality: 'Tênis',
      sports: ['Tênis', 'Vôlei'],
      level: 'Iniciante',
      reservationsDone: 12,
      matchesPlayed: 18,
      hoursOnCourt: 28,
      attendanceRate: 89,
      achievementsUnlocked: 3
    }
  },
  {
    id: 'u-joao',
    name: 'João Pereira',
    email: 'joao@playspace.com',
    role: 'CLIENTE',
    active: true,
    profile: {
      photo: 'JP',
      bio: 'Basquete noturno, jogos rápidos e ranking mensal.',
      city: 'Osasco',
      memberSince: '2025-11-08',
      favoriteModality: 'Basquete',
      sports: ['Basquete', 'Society'],
      level: 'Avançado',
      reservationsDone: 18,
      matchesPlayed: 44,
      hoursOnCourt: 64,
      attendanceRate: 95,
      achievementsUnlocked: 4
    }
  }
];

export const courts: Court[] = [
  {
    id: 'c-aurora',
    name: 'Quadra Aurora',
    modality: 'Beach Tennis',
    description: 'Areia premium, iluminação profissional e visual de clube.',
    pricePerHour: 120,
    playerCapacity: 4,
    status: 'Disponível',
    image: 'linear-gradient(135deg, #16321f, #0b1117 58%, #77ff4f)',
    location: 'Setor A',
    lighting: true,
    covered: false,
    rating: 4.9,
    favorite: true
  },
  {
    id: 'c-pulse',
    name: 'Quadra Pulse',
    modality: 'Futevôlei',
    description: 'Rede oficial, piso drenante e arquibancada compacta.',
    pricePerHour: 110,
    playerCapacity: 6,
    status: 'Disponível',
    image: 'linear-gradient(135deg, #183025, #102030 58%, #55d6ff)',
    location: 'Setor B',
    lighting: true,
    covered: false,
    rating: 4.7
  },
  {
    id: 'c-summit',
    name: 'Arena Summit',
    modality: 'Society',
    description: 'Campo society coberto com grama sintética e placar digital.',
    pricePerHour: 180,
    playerCapacity: 12,
    status: 'Disponível',
    image: 'linear-gradient(135deg, #17351f, #111827 60%, #42e695)',
    location: 'Setor C',
    lighting: true,
    covered: true,
    rating: 4.8
  },
  {
    id: 'c-tennis',
    name: 'Studio Tênis',
    modality: 'Tênis',
    description: 'Quadra rápida com marcação profissional e área técnica.',
    pricePerHour: 115,
    playerCapacity: 4,
    status: 'Disponível',
    image: 'linear-gradient(135deg, #27233f, #0f172a 55%, #8b5cf6)',
    location: 'Setor D',
    lighting: true,
    covered: true,
    rating: 4.6
  },
  {
    id: 'c-volei',
    name: 'Hangar Vôlei',
    modality: 'Vôlei',
    description: 'Quadra coberta, piso modular e ventilação natural.',
    pricePerHour: 95,
    playerCapacity: 12,
    status: 'Em manutenção',
    image: 'linear-gradient(135deg, #3b2a14, #111827 60%, #ffb84d)',
    location: 'Setor E',
    lighting: true,
    covered: true,
    rating: 4.4
  },
  {
    id: 'c-neon',
    name: 'Court Neon',
    modality: 'Basquete',
    description: 'Meia quadra urbana para treinos e eventos noturnos.',
    pricePerHour: 90,
    playerCapacity: 10,
    status: 'Disponível',
    image: 'linear-gradient(135deg, #23232d, #111827 62%, #ff5a7a)',
    location: 'Setor F',
    lighting: true,
    covered: false,
    rating: 4.5
  }
];

const reservationSeeds = [
  ['u-cliente', 'c-aurora', 0, '14:00', '15:00', 4, 'Confirmada', 'PIX'],
  ['u-lucas', 'c-summit', 0, '18:00', '20:00', 10, 'Em andamento', 'Cartão de Crédito'],
  ['u-carlos', 'c-pulse', 1, '16:00', '17:00', 4, 'Confirmada', 'PIX'],
  ['u-bia', 'c-tennis', 1, '09:00', '10:00', 2, 'Pendente', 'Cartão de Débito'],
  ['u-joao', 'c-neon', 2, '20:00', '21:00', 6, 'Confirmada', 'PIX'],
  ['u-cliente', 'c-aurora', 3, '19:00', '20:00', 4, 'Pendente', 'PIX'],
  ['u-lucas', 'c-summit', 4, '18:00', '19:00', 12, 'Confirmada', 'Cartão de Crédito'],
  ['u-carlos', 'c-pulse', 5, '10:00', '11:00', 4, 'Confirmada', 'PIX'],
  ['u-bia', 'c-tennis', 6, '12:00', '13:00', 2, 'Confirmada', 'Cartão de Débito'],
  ['u-cliente', 'c-aurora', -2, '18:00', '19:00', 4, 'Concluída', 'PIX'],
  ['u-cliente', 'c-summit', -5, '20:00', '22:00', 10, 'Concluída', 'Cartão de Crédito'],
  ['u-carlos', 'c-pulse', -1, '17:00', '18:00', 4, 'Cancelada', 'PIX'],
  ['u-joao', 'c-neon', -3, '21:00', '22:00', 6, 'Concluída', 'Cartão de Débito'],
  ['u-lucas', 'c-summit', 2, '08:00', '10:00', 12, 'Confirmada', 'Cartão de Crédito'],
  ['u-bia', 'c-tennis', 3, '11:00', '12:00', 2, 'Confirmada', 'PIX'],
  ['u-carlos', 'c-pulse', 4, '15:00', '16:00', 4, 'Pendente', 'PIX'],
  ['u-cliente', 'c-aurora', 7, '08:00', '09:00', 4, 'Confirmada', 'PIX'],
  ['u-lucas', 'c-summit', 7, '19:00', '21:00', 12, 'Pendente', 'Cartão de Crédito'],
  ['u-joao', 'c-neon', 8, '18:00', '19:00', 8, 'Confirmada', 'Cartão de Débito'],
  ['u-cliente', 'c-pulse', 9, '16:00', '17:00', 4, 'Confirmada', 'PIX']
] as const;

export const reservations: Reservation[] = reservationSeeds.map((seed, index) => {
  const [clientId, courtId, offset, startTime, endTime, players, status, paymentMethod] = seed;
  const user = users.find((item) => item.id === clientId)!;
  const court = courts.find((item) => item.id === courtId)!;
  const duration = Number(endTime.slice(0, 2)) - Number(startTime.slice(0, 2));
  return {
    id: `r-${index + 1}`,
    code: `PS-${String(index + 1234).padStart(4, '0')}`,
    clientId,
    clientName: user.name,
    courtId,
    courtName: court.name,
    modality: court.modality,
    date: isoDate(Number(offset)),
    startTime,
    endTime,
    players: Number(players),
    totalValue: court.pricePerHour * duration,
    status,
    paymentMethod,
    notes: 'Reserva demo PlaySpace',
    history: ['Reserva criada', status === 'Confirmada' ? 'Pagamento aprovado' : `Status atual: ${status}`]
  };
});

export const payments: Payment[] = reservations.map((reservation, index) => ({
  id: `p-${index + 1}`,
  reservationId: reservation.id,
  reservationCode: reservation.code,
  method: reservation.paymentMethod,
  status:
    reservation.status === 'Pendente'
      ? 'Pendente'
      : reservation.status === 'Cancelada'
        ? 'Cancelado'
        : 'Aprovado',
  amount: reservation.totalValue,
  transactionCode: `PAY-${reservation.code.replace('PS-', '')}`,
  paidAt: reservation.status === 'Pendente' ? undefined : at(index * 18)
}));

export const notifications: Record<string, NotificationItem[]> = {
  'u-admin': [
    { id: 'n-a-1', title: 'Nova reserva criada', message: 'Marina reservou a Quadra Aurora.', type: 'Reserva', read: false, createdAt: at(7) },
    { id: 'n-a-2', title: 'Pagamento aprovado', message: 'PIX demo aprovado em PS-1234.', type: 'Pagamento', read: false, createdAt: at(16) },
    { id: 'n-a-3', title: 'Quadra em manutenção', message: 'Hangar Vôlei requer inspeção.', type: 'Quadra', read: true, createdAt: at(50) }
  ],
  'u-cliente': [
    { id: 'n-c-1', title: 'Reserva próxima', message: 'Sua reserva na Quadra Aurora começa às 14:00.', type: 'Lembrete', read: false, createdAt: at(4) },
    { id: 'n-c-2', title: 'Nova conquista', message: 'Você está a 4 jogos da Sequência de 10 jogos.', type: 'Gamificação', read: false, createdAt: at(42) },
    { id: 'n-c-3', title: 'Quadra favorita disponível', message: 'Horário livre hoje às 18:00 na Quadra Aurora.', type: 'Recomendação', read: true, createdAt: at(80) }
  ]
};

export const activities: Activity[] = [
  { id: 'a-1', actor: 'Marina Costa', action: 'pagamento aprovado via PIX', category: 'Pagamento', createdAt: at(10) },
  { id: 'a-2', actor: 'Lucas Alves', action: 'criou reserva na Arena Summit', category: 'Reserva', createdAt: at(22) },
  { id: 'a-3', actor: 'Equipe PlaySpace', action: 'marcou Hangar Vôlei em manutenção', category: 'Quadra', createdAt: at(58) },
  { id: 'a-4', actor: 'Carlos Nunes', action: 'publicou anúncio para parceiro', category: 'Comunidade', createdAt: at(94) },
  { id: 'a-5', actor: 'Beatriz Lima', action: 'registrou avaliação 5 estrelas', category: 'Avaliação', createdAt: at(130) }
];

export const achievements: Record<string, Achievement[]> = {
  'u-cliente': [
    { id: 'ach-1', icon: 'Medal', title: 'Primeira Reserva', description: 'Criou a primeira reserva no PlaySpace.', unlockedAt: isoDate(-180), progress: 1, target: 1, percent: 100 },
    { id: 'ach-2', icon: 'Volleyball', title: 'Beach Tennis Lover', description: 'Complete 10 reservas de Beach Tennis.', progress: 8, target: 10, percent: 80 },
    { id: 'ach-3', icon: 'Flame', title: 'Sequência de 10 jogos', description: 'Jogue 10 vezes sem perder a sequência.', progress: 6, target: 10, percent: 60 },
    { id: 'ach-4', icon: 'Zap', title: '25 reservas', description: 'Alcance 25 reservas confirmadas.', unlockedAt: isoDate(-7), progress: 25, target: 25, percent: 100 },
    { id: 'ach-5', icon: 'Gem', title: 'Cliente VIP', description: 'Chegue a 30 reservas e 90% de comparecimento.', progress: 27, target: 30, percent: 90 },
    { id: 'ach-6', icon: 'Moon', title: 'Jogador Noturno', description: 'Reserve 10 horários após 19:00.', progress: 7, target: 10, percent: 70 }
  ]
};

export const posts: CommunityPost[] = [
  { id: 'post-1', authorId: 'u-carlos', authorName: 'Carlos Nunes', content: 'realizou uma nova reserva para Futevôlei hoje às 17:00.', type: 'Reserva', likes: 18, comments: 3, createdAt: at(9) },
  { id: 'post-2', authorId: 'u-cliente', authorName: 'Marina Costa', content: 'desbloqueou a conquista 25 reservas.', type: 'Conquista', likes: 31, comments: 6, createdAt: at(46) },
  { id: 'post-3', authorId: 'u-lucas', authorName: 'Lucas Alves', content: 'está procurando time para society às quintas.', type: 'Parceiros', likes: 12, comments: 5, createdAt: at(80) },
  { id: 'post-4', authorId: 'u-admin', authorName: 'PlaySpace Club', content: 'abriu inscrições para o Open PlaySpace Beach.', type: 'Campeonato', likes: 42, comments: 8, createdAt: at(120) },
  { id: 'post-5', authorId: 'u-admin', authorName: 'PlaySpace Club', content: 'liberou novos horários premium para o fim de semana.', type: 'Agenda', likes: 27, comments: 4, createdAt: at(180) }
];

export const partnerAds: PartnerAd[] = [
  { id: 'pa-1', playerId: 'u-cliente', playerName: 'Marina Costa', modality: 'Beach Tennis', level: 'Intermediário', city: 'São Paulo', availability: 'Ter e Qui, 18:00 - 21:00', notes: 'Procuro dupla fixa para treinos leves.' },
  { id: 'pa-2', playerId: 'u-lucas', playerName: 'Lucas Alves', modality: 'Society', level: 'Avançado', city: 'Campinas', availability: 'Sábados pela manhã', notes: 'Time precisa de goleiro e ala.' },
  { id: 'pa-3', playerId: 'u-carlos', playerName: 'Carlos Nunes', modality: 'Futevôlei', level: 'Intermediário', city: 'Santos', availability: 'Seg, Qua e Sex às 17:00', notes: 'Busco parceiro para campeonato.' }
];

export const championships: Championship[] = [
  {
    id: 'ch-1',
    name: 'Open PlaySpace Beach',
    modality: 'Beach Tennis',
    startDate: isoDate(18),
    categories: 'Duplas B, C e Iniciante',
    regulation: 'Fase de grupos e mata-mata, partidas em um set até 6 games.',
    prize: 'Troféu, créditos PlaySpace e brindes premium',
    status: 'Inscrições abertas',
    bracket: ['Grupo A', 'Semifinais', 'Final']
  },
  {
    id: 'ch-2',
    name: 'Liga Society Night',
    modality: 'Society',
    startDate: isoDate(32),
    categories: 'Misto e masculino',
    regulation: 'Tabela corrida com pontuação por vitória, empate e fair play.',
    prize: 'Plano mensal PlaySpace Prime',
    status: 'Em breve',
    bracket: ['Rodada 1', 'Rodada 2', 'Final']
  }
];

export const reviews: Review[] = [
  { id: 'rv-1', userName: 'Marina Costa', courtName: 'Quadra Aurora', cleaning: 5, lighting: 5, organization: 5, service: 5, courtQuality: 5, average: 5, comment: 'Check-in rápido, areia impecável e iluminação perfeita.' },
  { id: 'rv-2', userName: 'Lucas Alves', courtName: 'Arena Summit', cleaning: 4, lighting: 5, organization: 4, service: 5, courtQuality: 5, average: 4.6, comment: 'Ótima estrutura para society noturno.' },
  { id: 'rv-3', userName: 'Beatriz Lima', courtName: 'Studio Tênis', cleaning: 5, lighting: 4, organization: 5, service: 5, courtQuality: 4, average: 4.6, comment: 'Boa quadra coberta e equipe atenciosa.' }
];

export const settings: Settings = {
  company: 'PlaySpace Club',
  hours: '08:00 - 22:00',
  cancelationRuleHours: 2,
  minimumReservationMinutes: 60,
  modalities: ['Beach Tennis', 'Futevôlei', 'Society', 'Tênis', 'Vôlei', 'Basquete'],
  defaultPrices: {
    'Beach Tennis': 120,
    Futevôlei: 110,
    Society: 180,
    Tênis: 115,
    Vôlei: 95,
    Basquete: 90
  }
};

export const initialState: PlaySpaceState = {
  users,
  courts,
  reservations,
  payments,
  notifications,
  activities,
  achievements,
  posts,
  partnerAds,
  championships,
  reviews,
  settings,
  preferences: {
    theme: 'dark',
    favoriteModalities: ['Beach Tennis'],
    favoriteCourts: ['c-aurora'],
    tourDone: false
  }
};
