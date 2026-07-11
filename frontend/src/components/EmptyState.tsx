import { SearchX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = SearchX
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}) {
  return (
    <div className="soft-panel animate-enter flex min-h-48 flex-col items-center justify-center rounded-lg p-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-neon/25 bg-neon/10 shadow-glow">
        <Icon className="h-7 w-7 text-neon" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {actionLabel && onAction && (
        <button className="neon-button mt-5 rounded-lg px-4 py-2 text-sm font-black" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
