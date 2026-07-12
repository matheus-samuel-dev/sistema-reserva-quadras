import type { CourtStatus, PaymentStatus, ReservationStatus } from './types';

export type StatusTone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';
export type KnownStatus =
  | CourtStatus
  | ReservationStatus
  | PaymentStatus
  | 'Reservada'
  | 'Ativo'
  | 'Inativo'
  | 'Operacional'
  | 'Saudável'
  | 'Degradado'
  | 'Não configurado'
  | 'Demonstração'
  | 'Simulado'
  | 'Ativa';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  className: string;
  chartColor: string;
}

const toneStyles: Record<StatusTone, Pick<StatusMeta, 'className' | 'chartColor'>> = {
  success: {
    className: 'border-[var(--neon)] bg-[var(--success-soft)] text-[var(--neon)]',
    chartColor: 'var(--neon)'
  },
  warning: {
    className: 'border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]',
    chartColor: 'var(--warning)'
  },
  info: {
    className: 'border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan)]',
    chartColor: 'var(--cyan)'
  },
  danger: {
    className: 'border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]',
    chartColor: 'var(--danger)'
  },
  neutral: {
    className: 'border-line bg-[var(--surface-1)] text-muted',
    chartColor: 'var(--muted)'
  }
};

const defineStatus = (label: string, tone: StatusTone, chartColor?: string): StatusMeta => ({
  label,
  tone,
  ...toneStyles[tone],
  ...(chartColor ? { chartColor } : {})
});

export const reservationStatusOrder: readonly ReservationStatus[] = [
  'Confirmada',
  'Pendente',
  'Em andamento',
  'Concluída',
  'Cancelada'
];

export const statusMeta: Record<KnownStatus, StatusMeta> = {
  Disponível: defineStatus('Disponível', 'success'),
  'Em manutenção': defineStatus('Em manutenção', 'warning'),
  Indisponível: defineStatus('Indisponível', 'danger'),
  Reservada: defineStatus('Reservada', 'info'),
  Pendente: defineStatus('Pendente', 'warning'),
  Confirmada: defineStatus('Confirmada', 'success'),
  'Em andamento': defineStatus('Em andamento', 'info'),
  Concluída: defineStatus('Concluída', 'neutral', 'var(--status-completed, #2563eb)'),
  Cancelada: defineStatus('Cancelada', 'danger'),
  Aprovado: defineStatus('Aprovado', 'success'),
  Recusado: defineStatus('Recusado', 'danger'),
  Cancelado: defineStatus('Cancelado', 'danger'),
  Ativo: defineStatus('Ativo', 'success'),
  Inativo: defineStatus('Inativo', 'neutral'),
  Operacional: defineStatus('Operacional', 'success'),
  Saudável: defineStatus('Saudável', 'success'),
  Degradado: defineStatus('Degradado', 'warning'),
  'Não configurado': defineStatus('Não configurado', 'neutral'),
  Demonstração: defineStatus('Demonstração', 'info'),
  Simulado: defineStatus('Simulado', 'info'),
  Ativa: defineStatus('Ativa', 'success')
};

const fallbackStatus = defineStatus('Outro', 'neutral');

export function getStatusMeta(status: string): StatusMeta {
  return statusMeta[status as KnownStatus] ?? { ...fallbackStatus, label: status };
}
