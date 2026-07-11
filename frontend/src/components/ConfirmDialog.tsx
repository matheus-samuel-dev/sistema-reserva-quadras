import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  tone = 'danger',
  onConfirm,
  onClose
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'success';
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="grid gap-4">
        <div className={`rounded-lg border p-4 ${tone === 'danger' ? 'border-rose-400/30 bg-rose-400/10' : 'border-neon/30 bg-neon/10'}`}>
          <div className="flex gap-3">
            <AlertTriangle className={`mt-0.5 h-5 w-5 ${tone === 'danger' ? 'text-rose-300' : 'text-neon'}`} aria-hidden="true" />
            <p className="text-sm text-muted">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button className="ghost-button rounded-lg px-4 py-2 text-sm font-bold" type="button" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-black ${tone === 'danger' ? 'border border-rose-400/35 bg-rose-400/15 text-rose-100 hover:bg-rose-400/20' : 'neon-button'}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
