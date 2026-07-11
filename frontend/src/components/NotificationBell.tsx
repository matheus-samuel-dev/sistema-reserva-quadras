import { Bell, CalendarCheck, CheckCheck, CreditCard, Sparkles, Trash2, Volleyball } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import type { User } from '../lib/types';

const typeIcons: Record<string, LucideIcon> = {
  Reserva: CalendarCheck,
  Pagamento: CreditCard,
  Quadra: Volleyball,
  Lembrete: Bell,
  Gamificação: Sparkles,
  Recomendação: Sparkles
};

const relativeTime = (iso: string) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

export function NotificationBell({ user }: { user: User }) {
  const { state, markNotificationRead, clearNotifications } = useAppData();
  const [open, setOpen] = useState(false);
  const list = state.notifications[user.id] ?? [];
  const unread = list.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <button className="ghost-button relative rounded-lg p-2" onClick={() => setOpen((value) => !value)} aria-label="Notificações">
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">{unread}</span>}
      </button>
      {open && (
        <div className="glass-panel animate-enter absolute right-0 top-12 z-40 w-[min(92vw,420px)] rounded-lg p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <strong>Notificações</strong>
              <p className="text-xs text-muted">{unread > 0 ? `${unread} não lidas` : 'Tudo em dia'}</p>
            </div>
            <div className="flex gap-2">
              {unread > 0 && (
                <button className="ghost-button rounded-lg p-2" onClick={() => list.filter((item) => !item.read).forEach((item) => markNotificationRead(item.id, user.id))} aria-label="Marcar todas como lidas">
                  <CheckCheck className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button className="ghost-button rounded-lg p-2" onClick={() => clearNotifications(user.id)} aria-label="Limpar notificações">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="max-h-96 space-y-2 overflow-auto pr-1 scrollbar-thin">
            {list.length === 0 && <p className="rounded-lg border border-line p-4 text-sm text-muted">Nenhuma notificação no momento.</p>}
            {list.map((item) => {
              const Icon = typeIcons[item.type] ?? Bell;
              return (
                <button
                  key={item.id}
                  className={`w-full rounded-lg border p-3 text-left transition hover:border-neon/40 hover:bg-white/[0.04] ${item.read ? 'border-line bg-white/[0.02]' : 'border-neon/20 bg-neon/10'}`}
                  onClick={() => markNotificationRead(item.id, user.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${item.read ? 'border-line bg-white/5 text-muted' : 'border-neon/25 bg-neon/10 text-neon'}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold">{item.title}</p>
                        <span className="shrink-0 text-[11px] font-semibold text-muted">{relativeTime(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted">{item.message}</p>
                      <span className="mt-2 inline-flex rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-muted">{item.type}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
