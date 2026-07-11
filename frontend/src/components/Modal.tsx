import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export function Modal({
  title,
  open,
  onClose,
  maxWidth = 'max-w-2xl',
  children
}: PropsWithChildren<{ title: string; open: boolean; onClose: () => void; maxWidth?: string }>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm animate-enter" role="dialog" aria-modal="true">
      <section className={`glass-panel animate-scale max-h-[90vh] w-full overflow-auto rounded-lg p-5 ${maxWidth}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black">{title}</h2>
          <button className="ghost-button rounded-lg p-2" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
