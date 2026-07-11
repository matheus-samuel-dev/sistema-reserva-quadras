import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton rounded-lg', className)} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div className="animate-enter grid gap-5" aria-label="Carregando conteúdo">
      <div className="grid gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-[min(32rem,100%)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
