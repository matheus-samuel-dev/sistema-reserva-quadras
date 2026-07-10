import { SearchX } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="soft-panel flex min-h-48 flex-col items-center justify-center rounded-lg p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full border border-line bg-white/5">
        <SearchX className="h-6 w-6 text-neon" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
