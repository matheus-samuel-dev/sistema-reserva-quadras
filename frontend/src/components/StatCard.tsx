import type { LucideIcon } from 'lucide-react';

export function StatCard({ title, value, hint, icon: Icon }: { title: string; value: string | number; hint?: string; icon: LucideIcon }) {
  return (
    <article className="glass-panel card-hover rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted">{title}</p>
          <strong className="mt-2 block text-2xl font-black text-[var(--text)]">{value}</strong>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-neon/20 bg-neon/10">
          <Icon className="h-5 w-5 text-neon" aria-hidden="true" />
        </div>
      </div>
      {hint && <p className="mt-3 text-xs font-medium text-neon">{hint}</p>}
    </article>
  );
}
