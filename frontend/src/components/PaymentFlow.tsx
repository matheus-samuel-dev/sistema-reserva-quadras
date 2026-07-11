import { CheckCircle2, CreditCard, LockKeyhole, QrCode, WalletCards } from 'lucide-react';
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
      <div className="grid gap-3">
        {methods.map((item) => (
          <button key={item.value} className={`flex items-center gap-3 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${method === item.value ? 'border-neon bg-neon/10' : 'border-line bg-white/[0.03] hover:border-neon/30'}`} onClick={() => setMethod(item.value)}>
            {item.value === 'PIX' ? <QrCode className="h-5 w-5 text-neon" /> : <CreditCard className="h-5 w-5 text-cyan" />}
            <span className="flex-1">
              <strong className="block">{item.label}</strong>
              <span className="text-sm text-muted">{item.detail}</span>
            </span>
            {method === item.value && <CheckCircle2 className="h-5 w-5 text-neon" />}
          </button>
        ))}
      </div>
      {method === 'PIX' && (
        <div className="soft-panel rounded-lg p-4">
          <p className="text-sm font-bold">PIX demo</p>
          <div className="mt-3 grid aspect-square max-w-40 place-items-center rounded-lg border border-neon/30 bg-[repeating-linear-gradient(45deg,rgba(124,255,79,.18)_0_6px,transparent_6px_12px)]">
            <QrCode className="h-12 w-12 text-neon" />
          </div>
          <p className="mt-3 text-xs text-muted">Código demo: PLAYSPACE-{reservation.code}</p>
        </div>
      )}
      {processing && (
        <div className="rounded-lg border border-cyan/30 bg-cyan/10 p-3 text-sm text-cyan">
          Validando transação demo e confirmando reserva...
        </div>
      )}
      <button
        className="neon-button inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-black disabled:cursor-wait disabled:opacity-70"
        disabled={processing}
        onClick={() => {
          setProcessing(true);
          window.setTimeout(() => {
            payReservation(reservation.id, method, true);
            setProcessing(false);
            onPaid();
          }, 500);
        }}
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        {processing ? 'Processando pagamento...' : `Pagar com ${method}`}
      </button>
    </div>
  );
}
