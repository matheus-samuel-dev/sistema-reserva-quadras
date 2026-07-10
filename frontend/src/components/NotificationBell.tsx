import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import type { User } from '../lib/types';

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
        <div className="glass-panel absolute right-0 top-12 z-40 w-[min(92vw,380px)] rounded-lg p-3">
          <div className="mb-3 flex items-center justify-between">
            <strong>Notificações</strong>
            <button className="ghost-button rounded-lg p-2" onClick={() => clearNotifications(user.id)} aria-label="Limpar notificações">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-80 space-y-2 overflow-auto pr-1 scrollbar-thin">
            {list.length === 0 && <p className="rounded-lg border border-line p-4 text-sm text-muted">Nenhuma notificação no momento.</p>}
            {list.map((item) => (
              <button key={item.id} className="w-full rounded-lg border border-line bg-white/[0.03] p-3 text-left hover:border-neon/40" onClick={() => markNotificationRead(item.id, user.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">{item.message}</p>
                  </div>
                  {item.read ? <CheckCheck className="h-4 w-4 text-muted" aria-hidden="true" /> : <span className="mt-1 h-2 w-2 rounded-full bg-neon" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
