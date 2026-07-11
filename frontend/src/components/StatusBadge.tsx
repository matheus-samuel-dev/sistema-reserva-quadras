import clsx from 'clsx';
import type { CourtStatus, PaymentStatus, ReservationStatus } from '../lib/types';

const styles: Record<string, string> = {
  Disponível: 'border-neon/35 bg-neon/10 text-neon',
  'Em manutenção': 'border-amber/35 bg-amber/10 text-amber',
  Indisponível: 'border-rose-400/35 bg-rose-400/10 text-rose-300',
  Reservada: 'border-cyan/35 bg-cyan/10 text-cyan',
  Pendente: 'border-amber/35 bg-amber/10 text-amber',
  Confirmada: 'border-neon/35 bg-neon/10 text-neon',
  'Em andamento': 'border-cyan/35 bg-cyan/10 text-cyan',
  Concluída: 'border-slate-300/25 bg-slate-300/10 text-slate-200',
  Cancelada: 'border-rose-400/35 bg-rose-400/10 text-rose-300',
  Aprovado: 'border-neon/35 bg-neon/10 text-neon',
  Recusado: 'border-rose-400/35 bg-rose-400/10 text-rose-300',
  Cancelado: 'border-rose-400/35 bg-rose-400/10 text-rose-300',
  Ativo: 'border-neon/35 bg-neon/10 text-neon',
  Inativo: 'border-slate-300/25 bg-slate-300/10 text-slate-300',
  Operacional: 'border-neon/35 bg-neon/10 text-neon',
  Saudável: 'border-neon/35 bg-neon/10 text-neon'
};

export function StatusBadge({
  status,
  compact = false
}: {
  status: CourtStatus | ReservationStatus | PaymentStatus | string;
  compact?: boolean;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold shadow-sm',
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        styles[status] ?? 'border-line bg-white/5 text-muted'
      )}
    >
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
