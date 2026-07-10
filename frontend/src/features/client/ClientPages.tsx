import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Flame,
  Gem,
  Heart,
  Medal,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Trophy,
  Users,
  Volleyball,
  Zap
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { PaymentFlow } from '../../components/PaymentFlow';
import { ReservationForm } from '../../components/ReservationForm';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Toast } from '../../components/Toast';
import { WeeklyCalendar } from '../../components/WeeklyCalendar';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Modality, PartnerAd, Reservation } from '../../lib/types';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const chartColors = ['#7CFF4F', '#55D6FF', '#8B5CF6', '#FFB84D', '#FB7185'];
const iconMap = { Medal, Volleyball, Flame, Zap, Gem, Moon, Trophy, Award };

function ClientHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-black uppercase text-neon">Área do jogador</p>
      <h1 className="mt-1 text-3xl font-black">{title}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export function ClientHomePage() {
  const { user } = useAuth();
  const { state } = useAppData();
  const myReservations = state.reservations.filter((reservation) => reservation.clientId === user?.id);
  const upcoming = myReservations.filter((reservation) => reservation.date >= new Date().toISOString().slice(0, 10) && reservation.status !== 'Cancelada');
  const achievements = state.achievements[user?.id ?? ''] ?? [];

  return (
    <>
      <ClientHeader title={`Olá, ${user?.name.split(' ')[0]}!`} subtitle="Seu resumo esportivo, recomendações e próximos jogos." />
      <section className="glass-panel mb-4 overflow-hidden rounded-lg p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <div>
            <p className="text-sm font-bold text-neon">Clima do dia</p>
            <h2 className="mt-2 text-4xl font-black">27°C · Ideal para Beach Tennis</h2>
            <p className="mt-3 text-muted">Se chover no fim do dia, prefira as quadras cobertas Studio Tênis ou Arena Summit.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="soft-panel rounded-lg p-4">
              <p className="text-sm text-muted">Sequência atual</p>
              <strong className="text-3xl text-neon">6 jogos</strong>
            </div>
            <div className="soft-panel rounded-lg p-4">
              <p className="text-sm text-muted">Comparecimento</p>
              <strong className="text-3xl text-neon">{user?.profile.attendanceRate}%</strong>
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Minhas reservas" value={myReservations.length} icon={CalendarDays} />
        <StatCard title="Horas em quadra" value={user?.profile.hoursOnCourt ?? 0} icon={BarChart3} />
        <StatCard title="Modalidade favorita" value={user?.profile.favoriteModality ?? '-'} icon={Volleyball} />
        <StatCard title="Conquistas" value={achievements.filter((item) => item.percent >= 100).length} icon={Trophy} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_.9fr]">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Próximas reservas</h2>
          <div className="mt-4 grid gap-3">
            {upcoming.slice(0, 4).map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} />)}
            {upcoming.length === 0 && <EmptyState title="Sem reservas futuras" description="Crie uma nova reserva e mantenha sua sequência ativa." />}
          </div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Conquistas em progresso</h2>
          <div className="mt-4 grid gap-3">
            {achievements.slice(0, 4).map((achievement) => {
              const Icon = iconMap[achievement.icon as keyof typeof iconMap] ?? Award;
              return (
                <div key={achievement.id} className="rounded-lg border border-line bg-white/[0.03] p-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-neon" />
                    <div className="flex-1">
                      <p className="font-bold">{achievement.title}</p>
                      <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-neon" style={{ width: `${achievement.percent}%` }} /></div>
                    </div>
                    <span className="text-sm font-bold text-neon">{achievement.percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

function ReservationCard({ reservation, onDetails, onCancel, onPay }: { reservation: Reservation; onDetails?: () => void; onCancel?: () => void; onPay?: () => void }) {
  return (
    <article className="soft-panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{reservation.courtName}</h3>
          <p className="text-sm text-muted">{reservation.modality} · {reservation.date}</p>
          <p className="mt-1 text-sm">{reservation.startTime} - {reservation.endTime} · {reservation.code}</p>
        </div>
        <StatusBadge status={reservation.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onDetails && <button className="ghost-button rounded-lg px-3 py-2 text-sm font-semibold" onClick={onDetails}>Detalhes</button>}
        {onPay && reservation.status === 'Pendente' && <button className="neon-button rounded-lg px-3 py-2 text-sm font-bold" onClick={onPay}>Pagar</button>}
        {onCancel && !['Cancelada', 'Concluída'].includes(reservation.status) && <button className="ghost-button rounded-lg px-3 py-2 text-sm font-semibold" onClick={onCancel}>Cancelar</button>}
      </div>
    </article>
  );
}

export function ClientReservationsPage() {
  const { user } = useAuth();
  const { state, cancelReservation } = useAppData();
  const [tab, setTab] = useState<'Próximas' | 'Histórico'>('Próximas');
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [paying, setPaying] = useState<Reservation | null>(null);
  const [toast, setToast] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const list = state.reservations.filter((reservation) => reservation.clientId === user?.id).filter((reservation) => tab === 'Próximas' ? reservation.date >= today && reservation.status !== 'Cancelada' : reservation.date < today || ['Cancelada', 'Concluída'].includes(reservation.status));

  return (
    <>
      <ClientHeader title="Minhas reservas" subtitle="Acompanhe próximas partidas, histórico, pagamento e cancelamento." />
      <div className="mb-4 inline-flex rounded-lg border border-line bg-white/[0.03] p-1">
        {(['Próximas', 'Histórico'] as const).map((item) => <button key={item} className={`rounded-md px-4 py-2 text-sm font-bold ${tab === item ? 'bg-neon text-[#07110c]' : 'text-muted'}`} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onDetails={() => setSelected(reservation)}
            onPay={() => setPaying(reservation)}
            onCancel={() => {
              try {
                cancelReservation(reservation.id, user!);
                setToast('Reserva cancelada com sucesso.');
              } catch (err) {
                setToast(err instanceof Error ? err.message : 'Não foi possível cancelar.');
              }
            }}
          />
        ))}
      </div>
      {list.length === 0 && <EmptyState title="Nenhuma reserva nesta aba" description="As reservas aparecerão aqui automaticamente quando você criar ou concluir jogos." />}
      <Modal title="Detalhes da reserva" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <ReservationCard reservation={selected} />}</Modal>
      <Modal title="Pagamento demo" open={Boolean(paying)} onClose={() => setPaying(null)}>{paying && <PaymentFlow reservation={paying} onPaid={() => { setPaying(null); setToast('Pagamento aprovado. Reserva confirmada.'); }} />}</Modal>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

export function ClientNewReservationPage() {
  const { user } = useAuth();
  const { state } = useAppData();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const reservation = state.reservations.find((item) => item.id === createdId);

  return (
    <>
      <ClientHeader title="Nova reserva" subtitle="Escolha quadra, horário e avance para pagamento demo." />
      <section className="glass-panel rounded-lg p-5">
        {user && <ReservationForm actor={user} onCreated={setCreatedId} />}
      </section>
      <Modal title="Pagamento da reserva" open={Boolean(reservation)} onClose={() => setCreatedId(null)}>
        {reservation && <PaymentFlow reservation={reservation} onPaid={() => setCreatedId(null)} />}
      </Modal>
    </>
  );
}

export function ClientCourtsPage() {
  const { state, toggleFavoriteCourt } = useAppData();
  const [query, setQuery] = useState('');
  const filtered = state.courts.filter((court) => `${court.name} ${court.modality}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <ClientHeader title="Ver quadras" subtitle="Explore quadras, favoritos, preços, avaliações e disponibilidade." />
      <label className="relative mb-4 block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="w-full rounded-lg border border-line bg-white/5 py-3 pl-10 pr-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por quadra ou modalidade" />
      </label>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((court) => (
          <article key={court.id} className="glass-panel card-hover overflow-hidden rounded-lg">
            <div className="h-32" style={{ background: court.image }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black">{court.name}</h2>
                  <p className="text-sm text-muted">{court.modality} · {court.location}</p>
                </div>
                <button className="ghost-button rounded-lg p-2" onClick={() => toggleFavoriteCourt(court.id)} aria-label="Favoritar quadra">
                  <Heart className={`h-4 w-4 ${state.preferences.favoriteCourts.includes(court.id) ? 'fill-neon text-neon' : ''}`} />
                </button>
              </div>
              <p className="mt-3 text-sm text-muted">{court.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <strong className="text-neon">{currency(court.pricePerHour)}/h</strong>
                <StatusBadge status={court.status} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export function ClientAgendaPage() {
  const { state } = useAppData();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  return (
    <>
      <ClientHeader title="Agenda" subtitle="Veja horários da semana e encontre janelas livres." />
      <WeeklyCalendar reservations={state.reservations} onReservationClick={setSelected} onNewReservation={() => setCreating(true)} />
      <Modal title="Reserva selecionada" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <ReservationCard reservation={selected} />}</Modal>
      <Modal title="Nova reserva" open={creating} onClose={() => setCreating(false)}>{user && <ReservationForm actor={user} onCreated={() => setCreating(false)} />}</Modal>
    </>
  );
}

export function ClientPaymentsPage() {
  const { user } = useAuth();
  const { state } = useAppData();
  const payments = state.payments.filter((payment) => state.reservations.find((reservation) => reservation.id === payment.reservationId)?.clientId === user?.id);
  return (
    <>
      <ClientHeader title="Pagamentos" subtitle="Histórico de pagamentos PIX e cartões em modo demo." />
      <div className="grid gap-3">
        {payments.map((payment) => (
          <div key={payment.id} className="glass-panel flex items-center justify-between gap-3 rounded-lg p-4">
            <div>
              <p className="font-black">{payment.reservationCode}</p>
              <p className="text-sm text-muted">{payment.method} · {payment.transactionCode}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{currency(payment.amount)}</p>
              <StatusBadge status={payment.status} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ClientProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <ClientHeader title="Meu perfil esportivo" subtitle="Identidade, modalidades, conquistas e presença em quadra." />
      <section className="glass-panel overflow-hidden rounded-lg">
        <div className="h-40 bg-[linear-gradient(135deg,rgba(124,255,79,.25),rgba(85,214,255,.12)),radial-gradient(circle_at_20%_40%,rgba(124,255,79,.22),transparent_20rem)]" />
        <div className="-mt-12 p-5">
          <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-[var(--bg)] bg-neon text-2xl font-black text-[#07110c]">{user.profile.photo}</div>
          <h2 className="mt-4 text-3xl font-black">{user.name}</h2>
          <p className="text-muted">{user.profile.city} · membro desde {user.profile.memberSince}</p>
          <p className="mt-4 max-w-2xl text-muted">{user.profile.bio}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Modalidade favorita', user.profile.favoriteModality],
              ['Nível esportivo', user.profile.level],
              ['Reservas realizadas', String(user.profile.reservationsDone)],
              ['Horas em quadra', String(user.profile.hoursOnCourt)]
            ].map(([label, value]) => <div key={label} className="soft-panel rounded-lg p-4"><p className="text-sm text-muted">{label}</p><strong>{value}</strong></div>)}
          </div>
        </div>
      </section>
    </>
  );
}

export function ClientStatsPage() {
  const { user } = useAuth();
  const { state } = useAppData();
  const myReservations = state.reservations.filter((reservation) => reservation.clientId === user?.id);
  const monthly = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((month, index) => ({ month, reservas: [2, 3, 4, 5, 6, 7][index], gasto: [220, 340, 480, 520, 610, 740][index] }));
  const byModality = user?.profile.sports.map((sport, index) => ({ name: sport, value: [55, 25, 20][index] ?? 10 })) ?? [];
  return (
    <>
      <ClientHeader title="Estatísticas" subtitle="Evolução mensal, gasto, modalidades e frequência esportiva." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de reservas" value={myReservations.length} icon={CalendarDays} />
        <StatCard title="Total de partidas" value={user?.profile.matchesPlayed ?? 0} icon={Volleyball} />
        <StatCard title="Gasto mensal" value="R$ 540" icon={CreditCard} />
        <StatCard title="Sequência atual" value="6 jogos" icon={Flame} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Evolução mensal</h2>
          <div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly}><CartesianGrid stroke="rgba(148,163,184,.12)" /><XAxis dataKey="month" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{ background: '#0b1117', border: '1px solid rgba(148,163,184,.2)' }} /><Line dataKey="reservas" stroke="#7CFF4F" strokeWidth={3} /><Line dataKey="gasto" stroke="#55D6FF" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
        </section>
        <section className="glass-panel rounded-lg p-5">
          <h2 className="font-black">Utilização das modalidades</h2>
          <div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byModality} dataKey="value" innerRadius={60} outerRadius={90}>{byModality.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip contentStyle={{ background: '#0b1117', border: '1px solid rgba(148,163,184,.2)' }} /></PieChart></ResponsiveContainer></div>
        </section>
      </div>
    </>
  );
}

export function ClientCommunityPage() {
  const { state, likePost } = useAppData();
  return (
    <>
      <ClientHeader title="Feed da comunidade" subtitle="Timeline com reservas, conquistas, campeonatos e novidades." />
      <div className="grid gap-3">
        {state.posts.map((post) => (
          <article key={post.id} className="glass-panel rounded-lg p-4">
            <p><strong>{post.authorName}</strong> {post.content}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => likePost(post.id)}>Curtir · {post.likes}</button>
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => window.alert('Comentário demo registrado.')}>Comentar · {post.comments}</button>
              <button className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => navigator.clipboard?.writeText(post.content)}>Compartilhar</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export function ClientRankingPage() {
  const { state } = useAppData();
  const ranking = [...state.users].filter((user) => user.role === 'CLIENTE').sort((a, b) => b.profile.hoursOnCourt - a.profile.hoursOnCourt);
  return (
    <>
      <ClientHeader title="Ranking da comunidade" subtitle="Filtros semanal, mensal e anual com reservas, horas e frequência." />
      <div className="mb-4 flex gap-2">{['Semanal', 'Mensal', 'Anual'].map((item) => <button key={item} className="ghost-button rounded-lg px-4 py-2 text-sm font-bold">{item}</button>)}</div>
      <div className="grid gap-3">
        {ranking.map((player, index) => (
          <div key={player.id} className="glass-panel flex items-center gap-4 rounded-lg p-4">
            <strong className="grid h-10 w-10 place-items-center rounded-full bg-neon/15 text-neon">#{index + 1}</strong>
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white/10 font-black">{player.profile.photo}</div>
            <div className="flex-1">
              <p className="font-black">{player.name}</p>
              <p className="text-sm text-muted">{player.profile.favoriteModality} · {player.profile.attendanceRate}% comparecimento</p>
            </div>
            <strong>{player.profile.hoursOnCourt}h</strong>
          </div>
        ))}
      </div>
    </>
  );
}

export function ClientPartnersPage() {
  const { user } = useAuth();
  const { state, addPartnerAd } = useAppData();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState<Omit<PartnerAd, 'id'>>({ playerId: user?.id ?? '', playerName: user?.name ?? '', modality: user?.profile.favoriteModality ?? 'Beach Tennis', level: user?.profile.level ?? 'Intermediário', city: user?.profile.city ?? '', availability: 'Ter e Qui, 18:00 - 21:00', notes: '' });
  return (
    <>
      <ClientHeader title="Encontrar parceiros" subtitle="Crie anúncios e encontre jogadores compatíveis por modalidade, nível e cidade." />
      <button className="neon-button mb-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Criar anúncio</button>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.partnerAds.map((ad) => (
          <article key={ad.id} className="glass-panel rounded-lg p-4">
            <p className="font-black">{ad.playerName}</p>
            <p className="text-sm text-muted">{ad.modality} · {ad.level} · {ad.city}</p>
            <p className="mt-3 text-sm">{ad.availability}</p>
            <p className="mt-2 text-sm text-muted">{ad.notes}</p>
            <div className="mt-4 flex gap-2">
              <button className="neon-button rounded-lg px-3 py-2 text-sm font-bold" onClick={() => setToast('Interesse enviado em modo demo.')}>Tenho interesse</button>
              <button className="ghost-button rounded-lg px-3 py-2 text-sm font-bold" onClick={() => setToast('Mensagem demo preparada.')}>Enviar mensagem</button>
            </div>
          </article>
        ))}
      </div>
      <Modal title="Criar anúncio" open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={(event: FormEvent) => { event.preventDefault(); addPartnerAd(form); setOpen(false); setToast('Anúncio publicado.'); }}>
          <select className="rounded-lg border border-line bg-white/5 p-3" value={form.modality} onChange={(event) => setForm((current) => ({ ...current, modality: event.target.value as Modality }))}>{['Beach Tennis', 'Futevôlei', 'Society', 'Tênis', 'Vôlei', 'Basquete'].map((item) => <option key={item}>{item}</option>)}</select>
          <input className="rounded-lg border border-line bg-white/5 p-3" value={form.availability} onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))} />
          <textarea className="rounded-lg border border-line bg-white/5 p-3" placeholder="Observações" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          <button className="neon-button rounded-lg px-5 py-3 font-black">Publicar</button>
        </form>
      </Modal>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

export function ClientChampionshipsPage() {
  const { state } = useAppData();
  const [toast, setToast] = useState('');
  return (
    <>
      <ClientHeader title="Campeonatos" subtitle="Visualize, inscreva-se e acompanhe classificação e chaveamento demo." />
      <div className="grid gap-4 md:grid-cols-2">
        {state.championships.map((championship) => (
          <article key={championship.id} className="glass-panel rounded-lg p-5">
            <p className="text-sm font-bold text-neon">{championship.status}</p>
            <h2 className="mt-2 text-2xl font-black">{championship.name}</h2>
            <p className="mt-2 text-muted">{championship.modality} · {championship.categories}</p>
            <p className="mt-4 text-sm">{championship.regulation}</p>
            <div className="mt-4 flex gap-2">{championship.bracket.map((item) => <span key={item} className="rounded-full border border-line px-3 py-1 text-xs">{item}</span>)}</div>
            <button className="neon-button mt-5 rounded-lg px-4 py-2 font-bold" onClick={() => setToast(`Inscrição demo enviada para ${championship.name}.`)}>Inscrever-se</button>
          </article>
        ))}
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </>
  );
}

export function ClientAiPage() {
  const { user } = useAuth();
  const { askAi } = useAppData();
  const [question, setQuestion] = useState('Qual meu melhor horário para jogar?');
  const [answer, setAnswer] = useState('');
  const suggestions = ['Quanto gastei este mês?', 'Qual modalidade eu mais pratico?', 'Qual quadra utilizo com mais frequência?', 'Quando foi minha última reserva?'];
  return (
    <>
      <ClientHeader title="PlaySpace AI" subtitle="Assistente virtual demo usando seus dados internos do sistema." />
      <section className="glass-panel rounded-lg p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-neon/15"><Sparkles className="h-6 w-6 text-neon" /></div>
          <div>
            <h2 className="font-black">PlaySpace AI</h2>
            <p className="text-sm text-muted">Sem APIs externas. Respostas simuladas com dados locais.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} className="ghost-button rounded-lg px-3 py-2 text-sm" onClick={() => setQuestion(item)}>{item}</button>)}</div>
        <form className="mt-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (user) setAnswer(askAi(question, user)); }}>
          <input className="flex-1 rounded-lg border border-line bg-white/5 p-3" value={question} onChange={(event) => setQuestion(event.target.value)} />
          <button className="neon-button rounded-lg px-4" aria-label="Enviar pergunta"><Send className="h-5 w-5" /></button>
        </form>
        {answer && <div className="mt-5 rounded-lg border border-neon/30 bg-neon/10 p-4"><p className="text-sm font-bold text-neon">Resposta</p><p className="mt-2">{answer}</p></div>}
      </section>
    </>
  );
}
