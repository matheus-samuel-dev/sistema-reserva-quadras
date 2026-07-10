import { Dumbbell } from 'lucide-react';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-neon/30 bg-neon/10 shadow-glow">
        <Dumbbell className="h-5 w-5 text-neon" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-lg font-black tracking-normal text-[var(--text)]">PlaySpace</p>
          <p className="text-xs font-medium text-muted">Reservas de Quadras</p>
        </div>
      )}
    </div>
  );
}
