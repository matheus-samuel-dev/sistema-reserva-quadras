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
    success: 'border-neon/30 bg-[#07110c]/95 text-white',
    warning: 'border-amber/35 bg-[#171205]/95 text-white',
    danger: 'border-rose-400/35 bg-[#18080d]/95 text-white',
    info: 'border-cyan/35 bg-[#061219]/95 text-white'
  };
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-neon" aria-hidden="true" />,
    warning: <AlertCircle className="h-5 w-5 text-amber" aria-hidden="true" />,
    danger: <AlertCircle className="h-5 w-5 text-rose-300" aria-hidden="true" />,
    info: <Info className="h-5 w-5 text-cyan" aria-hidden="true" />
  };

  return (
    <div className={`fixed bottom-24 right-4 z-50 flex max-w-sm animate-enter items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-glow ${styles[tone]}`}>
      {icons[tone]}
      <span className="flex-1">{message}</span>
      <button className="rounded-md p-1 hover:bg-white/10" onClick={onClose} aria-label="Fechar aviso">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
