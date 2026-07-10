import { CheckCircle2, X } from 'lucide-react';

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-neon/30 bg-[#07110c]/95 px-4 py-3 text-sm text-white shadow-glow">
      <CheckCircle2 className="h-5 w-5 text-neon" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} aria-label="Fechar aviso">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
