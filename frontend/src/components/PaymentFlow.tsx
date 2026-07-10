import { CheckCircle2, CreditCard, QrCode } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import type { PaymentMethod, Reservation } from '../lib/types';

const methods: Array<{ value: PaymentMethod; label: string; detail: string }> = [
  { value: 'PIX', label: 'PIX', detail: 'Aprovação imediata' },
  { value: 'Cartão de Crédito', label: 'Cartão de Crédito', detail: 'Até 12x demo' },
  { value: 'Cartão de Débito', label: 'Cartão de Débito', detail: 'Débito aprovado na hora' }
];

export function PaymentFlow({ reservation, onPaid }: { reservation: Reservation; onPaid: () => void }) {
  const { payReservation } = useAppData();
  const [method, setMethod] = useState<PaymentMethod>(reservation.paymentMethod);
  const [processing, setProcessing] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="soft-panel rounded-lg p-4">
        <p className="text-sm text-muted">Resumo da reserva</p>
        <h3 className="mt-2 text-lg font-black">{reservation.courtName}</h3>
        <p className="text-sm text-muted">{reservation.date} · {reservation.startTime} - {reservation.endTime}</p>
        <div className="mt-4 flex items-center justify-between">
          <span>{reservation.players} jogadores</span>
          <strong className="text-xl text-neon">R$ {reservation.totalValue.toFixed(2)}</strong>
        </div>
      </div>
      <div className="grid gap-3">
        {methods.map((item) => (
          <button key={item.value} className={`flex items-center gap-3 rounded-lg border p-4 text-left ${method === item.value ? 'border-neon bg-neon/10' : 'border-line bg-white/[0.03]'}`} onClick={() => setMethod(item.value)}>
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
      <button
        className="neon-button rounded-lg px-5 py-3 font-black disabled:cursor-wait disabled:opacity-70"
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
        {processing ? 'Processando pagamento...' : `Pagar com ${method}`}
      </button>
    </div>
  );
}
