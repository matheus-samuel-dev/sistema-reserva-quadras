import clsx from 'clsx';
import type { CourtStatus, PaymentStatus, ReservationStatus } from '../lib/types';
import { getStatusMeta } from '../lib/status';

export function StatusBadge({
  status,
  compact = false
}: {
  status: CourtStatus | ReservationStatus | PaymentStatus | string;
  compact?: boolean;
}) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold shadow-sm',
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.className
      )}
      aria-label={`Status: ${meta.label}`}
    >
      <span className="status-dot" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
