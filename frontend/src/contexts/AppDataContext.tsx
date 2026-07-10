import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { demoCredentials, initialState } from '../lib/demoData';
import type {
  Court,
  NotificationItem,
  PartnerAd,
  Payment,
  PaymentMethod,
  PlaySpaceState,
  Reservation,
  ReservationFormInput,
  User
} from '../lib/types';

interface AppDataContextValue {
  state: PlaySpaceState;
  demoCredentials: typeof demoCredentials;
  createReservation: (input: ReservationFormInput, actor: User) => Reservation;
  cancelReservation: (reservationId: string, actor: User) => Reservation;
  payReservation: (reservationId: string, method: PaymentMethod, approve?: boolean) => Payment;
  saveCourt: (court: Court) => Court;
  removeCourt: (courtId: string) => void;
  saveUser: (user: User) => User;
  toggleUserActive: (userId: string) => void;
  markNotificationRead: (notificationId: string, userId: string) => void;
  clearNotifications: (userId: string) => void;
  likePost: (postId: string) => void;
  addPartnerAd: (ad: Omit<PartnerAd, 'id'>) => PartnerAd;
  toggleFavoriteCourt: (courtId: string) => void;
  toggleTheme: () => void;
  finishTour: () => void;
  askAi: (question: string, user: User) => string;
  resetDemo: () => void;
}

const STORAGE_KEY = 'playspace-state-v1';
const AppDataContext = createContext<AppDataContextValue | null>(null);

const cloneInitialState = (): PlaySpaceState => JSON.parse(JSON.stringify(initialState));

const loadState = (): PlaySpaceState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : cloneInitialState();
  } catch {
    return cloneInitialState();
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  const value = useMemo<AppDataContextValue>(() => {
    const createReservation = (input: ReservationFormInput, actor: User) => {
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
          { id: crypto.randomUUID(), actor: actor.name, action: `criou a reserva ${reservation.code}`, category: 'Reserva', createdAt: nowIso() },
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

    const cancelReservation = (reservationId: string, actor: User) => {
      const reservation = state.reservations.find((item) => item.id === reservationId);
      if (!reservation) throw new Error('Reserva não encontrada.');
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
        activities: [{ id: crypto.randomUUID(), actor: actor.name, action: `cancelou ${reservation.code}`, category: 'Cancelamento', createdAt: nowIso() }, ...current.activities]
      }));
      return updated;
    };

    const payReservation = (reservationId: string, method: PaymentMethod, approve = true) => {
      const reservation = state.reservations.find((item) => item.id === reservationId);
      if (!reservation) throw new Error('Reserva não encontrada.');
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
      createReservation,
      cancelReservation,
      payReservation,
      saveCourt: (court) => {
        const saved = court.id ? court : { ...court, id: crypto.randomUUID() };
        setState((current) => ({
          ...current,
          courts: current.courts.some((item) => item.id === saved.id)
            ? current.courts.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current.courts]
        }));
        return saved;
      },
      removeCourt: (courtId) => setState((current) => ({ ...current, courts: current.courts.filter((court) => court.id !== courtId) })),
      saveUser: (user) => {
        const saved = user.id ? user : { ...user, id: crypto.randomUUID() };
        setState((current) => ({
          ...current,
          users: current.users.some((item) => item.id === saved.id)
            ? current.users.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current.users]
        }));
        return saved;
      },
      toggleUserActive: (userId) =>
        setState((current) => ({
          ...current,
          users: current.users.map((user) => (user.id === userId ? { ...user, active: !user.active } : user))
        })),
      markNotificationRead: (notificationId, userId) =>
        setState((current) => ({
          ...current,
          notifications: {
            ...current.notifications,
            [userId]: (current.notifications[userId] ?? []).map((item) => (item.id === notificationId ? { ...item, read: true } : item))
          }
        })),
      clearNotifications: (userId) =>
        setState((current) => ({
          ...current,
          notifications: { ...current.notifications, [userId]: [] }
        })),
      likePost: (postId) =>
        setState((current) => ({
          ...current,
          posts: current.posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post))
        })),
      addPartnerAd: (ad) => {
        const saved = { ...ad, id: crypto.randomUUID() };
        setState((current) => ({ ...current, partnerAds: [saved, ...current.partnerAds] }));
        return saved;
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
      finishTour: () => setState((current) => ({ ...current, preferences: { ...current.preferences, tourDone: true } })),
      askAi: (question, user) => {
        const normalized = question.toLowerCase();
        const myReservations = state.reservations.filter((reservation) => reservation.clientId === user.id);
        if (normalized.includes('gastei') || normalized.includes('gasto')) return 'Neste mês, seu gasto estimado é R$ 540,00. No ano, você está em R$ 4.380,00.';
        if (normalized.includes('horário') || normalized.includes('horario')) return 'Seu melhor horário para jogar é 19:00, com maior frequência e comparecimento.';
        if (normalized.includes('modalidade')) return `Sua modalidade mais praticada é ${user.profile.favoriteModality}.`;
        if (normalized.includes('quadra')) return 'A quadra que você mais utiliza é a Quadra Aurora.';
        if (normalized.includes('última') || normalized.includes('ultima')) return myReservations[0] ? `Sua última reserva foi ${myReservations[0].code} em ${myReservations[0].courtName}.` : 'Você ainda não tem reservas.';
        return `Analisei seus dados: você tem ${user.profile.hoursOnCourt} horas em quadra, ${user.profile.attendanceRate}% de comparecimento e uma sequência ativa de 6 jogos.`;
      },
      resetDemo: () => setState(cloneInitialState())
    };
  }, [state]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData deve ser usado dentro de AppDataProvider.');
  return context;
}
