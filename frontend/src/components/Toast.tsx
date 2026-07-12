import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export function Toast({
  message,
  onClose,
  tone = 'success'
}: {
  message: string;
  onClose: () => void;
  tone?: 'success' | 'warning' | 'danger' | 'info';
}) {
  if (!message) return null;

  const styles = {
    success: 'border-neon/30 bg-[var(--surface-elevated)] text-[var(--text)]',
    warning: 'border-amber/35 bg-[var(--surface-elevated)] text-[var(--text)]',
    danger: 'border-rose-400/35 bg-[var(--surface-elevated)] text-[var(--text)]',
    info: 'border-cyan/35 bg-[var(--surface-elevated)] text-[var(--text)]'
  };
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-neon" aria-hidden="true" />,
    warning: <AlertCircle className="h-5 w-5 text-amber" aria-hidden="true" />,
    danger: <AlertCircle className="h-5 w-5 text-rose-300" aria-hidden="true" />,
    info: <Info className="h-5 w-5 text-cyan" aria-hidden="true" />
  };

  return (
    <div className={`fixed bottom-24 left-4 right-4 z-[80] flex max-w-sm animate-enter items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-panel sm:left-auto ${styles[tone]}`} role={tone === 'danger' ? 'alert' : 'status'} aria-live={tone === 'danger' ? 'assertive' : 'polite'}>
      {icons[tone]}
      <span className="flex-1">{message}</span>
      <button className="rounded-md p-1 hover:bg-white/10" onClick={onClose} aria-label="Fechar aviso">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
