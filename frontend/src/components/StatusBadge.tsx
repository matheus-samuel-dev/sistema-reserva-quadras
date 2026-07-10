import clsx from 'clsx';
import type { CourtStatus, PaymentStatus, ReservationStatus } from '../lib/types';

const styles: Record<string, string> = {
  Disponível: 'border-neon/30 bg-neon/10 text-neon',
  'Em manutenção': 'border-amber/30 bg-amber/10 text-amber',
  Indisponível: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  Pendente: 'border-amber/30 bg-amber/10 text-amber',
  Confirmada: 'border-neon/30 bg-neon/10 text-neon',
  'Em andamento': 'border-cyan/30 bg-cyan/10 text-cyan',
  Concluída: 'border-slate-300/20 bg-slate-300/10 text-slate-200',
  Cancelada: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  Aprovado: 'border-neon/30 bg-neon/10 text-neon',
  Recusado: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  Cancelado: 'border-rose-400/30 bg-rose-400/10 text-rose-300'
};

export function StatusBadge({ status }: { status: CourtStatus | ReservationStatus | PaymentStatus | string }) {
  return <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', styles[status] ?? 'border-line bg-white/5 text-muted')}>{status}</span>;
}
