import { CheckCircle2, Copy, CreditCard, LockKeyhole, QrCode, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import type { PaymentMethod, Reservation } from '../lib/types';

const methods: Array<{ value: PaymentMethod; label: string; detail: string }> = [
  { value: 'PIX', label: 'PIX', detail: 'Aprovação imediata' },
  { value: 'Cartão de Crédito', label: 'Cartão de Crédito', detail: 'Até 12x demo' },
  { value: 'Cartão de Débito', label: 'Cartão de Débito', detail: 'Débito aprovado na hora' }
];

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PaymentFlow({ reservation, onPaid }: { reservation: Reservation; onPaid: () => void }) {
  const { payReservation } = useAppData();
  const [method, setMethod] = useState<PaymentMethod>(reservation.paymentMethod);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pixCode = `PLAYSPACE-DEMO-${reservation.code}-${reservation.totalValue.toFixed(2)}`;

  const copyPixCode = async () => {
    setError('');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pixCode);
      } else {
        const field = document.createElement('textarea');
        field.value = pixCode;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copiedWithFallback = document.execCommand('copy');
        field.remove();
        if (!copiedWithFallback) throw new Error('Cópia não suportada.');
      }
      setCopied(true);
    } catch {
      setCopied(false);
      setError('Não foi possível copiar automaticamente. Selecione o código PIX acima e copie manualmente.');
    }
  };

  return (
    <div className="grid gap-4">
      <div className="soft-panel rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Resumo da reserva</p>
            <h3 className="mt-2 text-lg font-black">{reservation.courtName}</h3>
            <p className="text-sm text-muted">{reservation.date} · {reservation.startTime} - {reservation.endTime}</p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-neon/25 bg-neon/10">
            <WalletCards className="h-5 w-5 text-neon" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs text-muted">Jogadores</p>
            <strong>{reservation.players}</strong>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs text-muted">Código</p>
            <strong>{reservation.code}</strong>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs text-muted">Total</p>
            <strong className="text-neon">{currency(reservation.totalValue)}</strong>
          </div>
        </div>
      </div>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-bold">Forma de pagamento</legend>
        {methods.map((item) => (
          <label
            key={item.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-neon/45 ${method === item.value ? 'border-neon bg-neon/10' : 'border-line bg-white/[0.03] hover:border-neon/30'}`}
          >
            <input
              className="sr-only"
              type="radio"
              name={`payment-method-${reservation.id}`}
              value={item.value}
              checked={method === item.value}
              onChange={() => setMethod(item.value)}
            />
            {item.value === 'PIX' ? <QrCode className="h-5 w-5 text-neon" aria-hidden="true" /> : <CreditCard className="h-5 w-5 text-cyan" aria-hidden="true" />}
            <span className="flex-1">
              <strong className="block">{item.label}</strong>
              <span className="text-sm text-muted">{item.detail}</span>
            </span>
            {method === item.value && <CheckCircle2 className="h-5 w-5 text-neon" aria-hidden="true" />}
          </label>
        ))}
      </fieldset>
      {method === 'PIX' && (
        <div className="soft-panel rounded-lg p-4">
          <p className="text-sm font-bold">PIX demo</p>
          <div className="mt-3 grid aspect-square max-w-40 place-items-center rounded-lg border border-neon/30 bg-[repeating-linear-gradient(45deg,rgba(124,255,79,.18)_0_6px,transparent_6px_12px)]">
            <QrCode className="h-12 w-12 text-neon" aria-hidden="true" />
          </div>
          <p className="mt-3 break-all text-xs text-muted">Código demo: {pixCode}</p>
          <button
            className="ghost-button mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"
            type="button"
            onClick={() => void copyPixCode()}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            {copied ? 'Código copiado' : 'Copiar código PIX'}
          </button>
          <p className="mt-2 text-[11px] font-semibold text-amber">Demonstração: nenhum pagamento real será processado.</p>
        </div>
      )}
      {processing && (
        <div className="rounded-lg border border-cyan/30 bg-cyan/10 p-3 text-sm text-cyan" role="status" aria-live="polite">
          Validando transação demo e confirmando reserva...
        </div>
      )}
      {error && <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)]" role="alert">{error}</div>}
      <button
        className="neon-button inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-black disabled:cursor-wait disabled:opacity-70"
        disabled={processing}
        type="button"
        onClick={async () => {
          setError('');
          setProcessing(true);
          try {
            await payReservation(reservation.id, method, true);
            onPaid();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível processar o pagamento demonstrativo.');
          } finally {
            setProcessing(false);
          }
        }}
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        {processing ? 'Processando pagamento...' : `Pagar com ${method}`}
      </button>
    </div>
  );
}
