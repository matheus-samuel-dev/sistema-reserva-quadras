import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
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
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal title={title} open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="grid gap-4">
        <div className={`rounded-lg border p-4 ${tone === 'danger' ? 'border-rose-400/30 bg-rose-400/10' : 'border-neon/30 bg-neon/10'}`}>
          <div className="flex gap-3">
            <AlertTriangle className={`mt-0.5 h-5 w-5 ${tone === 'danger' ? 'text-rose-300' : 'text-neon'}`} aria-hidden="true" />
            <p className="text-sm text-muted">{description}</p>
          </div>
        </div>
        {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button className="ghost-button rounded-lg px-4 py-2 text-sm font-bold" type="button" onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-black disabled:opacity-60 ${tone === 'danger' ? 'border border-rose-400/35 bg-rose-400/15 text-[var(--danger)] hover:bg-rose-400/20' : 'neon-button'}`}
            type="button"
            disabled={submitting}
            onClick={async () => {
              if (submitting) return;
              setSubmitting(true);
              setError('');
              try { await onConfirm(); }
              catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a ação.'); }
              finally { setSubmitting(false); }
            }}
          >
            {submitting ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
