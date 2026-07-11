import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'neon'
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: 'neon' | 'cyan' | 'amber' | 'danger' | 'neutral';
}) {
  const toneClasses = {
    neon: 'border-neon/20 bg-neon/10 text-neon',
    cyan: 'border-cyan/20 bg-cyan/10 text-cyan',
    amber: 'border-amber/20 bg-amber/10 text-amber',
    danger: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
    neutral: 'border-slate-300/20 bg-slate-300/10 text-slate-200'
  };

  return (
    <article className="glass-panel card-hover animate-enter rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-normal text-muted">{title}</p>
          <strong className="metric-value mt-2 block truncate text-2xl font-black text-[var(--text)]">{value}</strong>
        </div>
        <div className={clsx('grid h-12 w-12 shrink-0 place-items-center rounded-lg border', toneClasses[tone])}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      {hint && <p className={clsx('mt-3 text-xs font-semibold', tone === 'danger' ? 'text-rose-300' : 'text-neon')}>{hint}</p>}
    </article>
  );
}
