import { CalendarDays, Edit3, MapPin, Plus, Search, ShieldCheck, Trash2, Trophy, Users } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { Toast } from '../../components/Toast';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Championship, Modality } from '../../lib/types';

const modalities: Modality[] = ['Beach Tennis', 'Futevôlei', 'Society', 'Tênis', 'Vôlei', 'Basquete'];
const statuses = ['RASCUNHO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'] as const;
const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho', INSCRICOES_ABERTAS: 'Inscrições abertas', INSCRICOES_ENCERRADAS: 'Inscrições encerradas',
  EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado'
};
const statusStyles: Record<string, string> = {
  RASCUNHO: 'border-line text-muted', INSCRICOES_ABERTAS: 'border-neon/35 bg-neon/10 text-neon',
  INSCRICOES_ENCERRADAS: 'border-amber/35 bg-amber/10 text-amber', EM_ANDAMENTO: 'border-cyan/35 bg-cyan/10 text-cyan',
  CONCLUIDO: 'border-line bg-[var(--surface-2)] text-muted', CANCELADO: 'border-rose-400/35 bg-rose-400/10 text-[var(--danger)]'
};
const transitions: Record<string, string[]> = {
  RASCUNHO: ['INSCRICOES_ABERTAS', 'CANCELADO'],
  INSCRICOES_ABERTAS: ['INSCRICOES_ENCERRADAS', 'CANCELADO'],
  INSCRICOES_ENCERRADAS: ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'CANCELADO'],
  EM_ANDAMENTO: ['CONCLUIDO', 'CANCELADO'], CONCLUIDO: [], CANCELADO: []
};
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)) : 'A definir';
const today = () => new Date().toISOString().slice(0, 10);
const datePlus = (days: number) => { const value = new Date(); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); };

const blankChampionship = (courtId = ''): Championship => ({
  id: '', name: '', description: '', modality: 'Beach Tennis', courtId, courtName: '', location: '', city: 'São Paulo',
  startDate: datePlus(30), endDate: datePlus(31), registrationDeadline: datePlus(20), maxParticipants: 16,
  enrolledParticipants: 0, availableSpots: 16, format: 'Fase de grupos e eliminatórias', categories: 'Categoria aberta',
  regulation: '', prize: '', registrationFee: 0, status: 'RASCUNHO', bracket: []
});

function Status({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusStyles[value] ?? 'border-line text-muted'}`}>{statusLabels[value] ?? value}</span>;
}

export function ChampionshipsPage() {
  const { user } = useAuth();
  const {
    state,
    cancelChampionshipEnrollment,
    changeChampionshipStatus,
    loadChampionshipParticipants,
    registerChampionship,
    removeChampionship,
    saveChampionship
  } = useAppData();
  const [query, setQuery] = useState('');
  const [modality, setModality] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [detailId, setDetailId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Championship>(() => blankChampionship(state.courts[0]?.id));
  const [deleteId, setDeleteId] = useState('');
  const [cancelEnrollmentId, setCancelEnrollmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  if (!user) return null;
  const isAdmin = user.role === 'ADMIN';
  const detail = state.championships.find((item) => item.id === detailId);
  const participants = state.championshipEnrollments.filter((item) => item.championshipId === detailId && item.status === 'ATIVA');

  const filtered = useMemo(() => state.championships
    .filter((item) => isAdmin || item.status !== 'RASCUNHO')
    .filter((item) => `${item.name} ${item.city ?? ''} ${item.location ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => !modality || item.modality === modality)
    .filter((item) => !status || item.status === status)
    .filter((item) => !city || (item.city ?? '').toLowerCase().includes(city.toLowerCase()))
    .filter((item) => !fromDate || item.startDate >= fromDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate)), [city, fromDate, isAdmin, modality, query, state.championships, status]);

  const openCreate = () => {
    const firstCourt = state.courts.find((court) => court.modality === 'Beach Tennis') ?? state.courts[0];
    setDraft({ ...blankChampionship(firstCourt?.id), courtName: firstCourt?.name ?? '', location: firstCourt?.name ?? '' });
    setError(''); setFormOpen(true);
  };
  const openEdit = (item: Championship) => { setDraft({ ...item, bracket: [...item.bracket] }); setError(''); setFormOpen(true); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError('');
    try {
      const saved = await saveChampionship(draft, user);
      setFormOpen(false); setToast(draft.id ? 'Campeonato atualizado.' : 'Campeonato criado.'); setDetailId(saved.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o campeonato.'); }
    finally { setSubmitting(false); }
  };

  const openDetail = async (item: Championship) => {
    setDetailId(item.id); setError('');
    try { await loadChampionshipParticipants(item.id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível carregar participantes.'); }
  };

  const updateStatus = async (target: string) => {
    if (!detail || submitting) return;
    setSubmitting(true); setError('');
    try { await changeChampionshipStatus(detail.id, target, user); setToast(`Status alterado para “${statusLabels[target]}”.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível alterar o status.'); }
    finally { setSubmitting(false); }
  };

  const enroll = async (item: Championship) => {
    setSubmitting(true); setError('');
    try { await registerChampionship(item.id, user); setToast(`Inscrição confirmada em ${item.name}.`); }
    catch (reason) { setToast(reason instanceof Error ? reason.message : 'Não foi possível realizar a inscrição.'); }
    finally { setSubmitting(false); }
  };

  return <>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-black uppercase text-neon">Competições PlaySpace</p><h1 className="mt-1 text-3xl font-black">Campeonatos</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{isAdmin ? 'Crie eventos, controle inscrições, participantes e cada etapa da competição.' : 'Encontre campeonatos, consulte regulamentos e acompanhe suas inscrições.'}</p></div>
      {isAdmin && <button className="neon-button inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 font-black" type="button" onClick={openCreate}><Plus className="h-4 w-4" /> Novo campeonato</button>}
    </header>

    <section className="glass-panel mb-4 rounded-lg p-4" aria-label="Filtros de campeonatos">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="relative"><span className="sr-only">Buscar</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" /><input className="app-input w-full pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou local" /></label>
        <select className="app-input" aria-label="Filtrar por modalidade" value={modality} onChange={(event) => setModality(event.target.value)}><option value="">Todas as modalidades</option>{modalities.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="app-input" aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option>{statuses.filter((item) => isAdmin || item !== 'RASCUNHO').map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
        <input className="app-input" aria-label="Filtrar por cidade" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Cidade" />
        <label className="grid gap-1 text-xs font-bold text-muted">A partir de<input className="app-input text-[var(--text)]" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
      </div>
    </section>

    <section className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {filtered.map((item) => {
        const enrolled = item.currentUserEnrolled || state.championshipEnrollments.some((entry) => entry.championshipId === item.id && entry.playerId === user.id && entry.status === 'ATIVA');
        return <article key={item.id} className="glass-panel card-hover overflow-hidden rounded-lg">
          <div className="h-2 bg-[linear-gradient(90deg,var(--primary),var(--info))]" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-black uppercase text-neon">{item.modality}</p><h2 className="mt-1 text-xl font-black leading-tight">{item.name}</h2></div><Status value={item.status} /></div>
            <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-muted">{item.description || item.regulation}</p>
            <div className="mt-4 grid gap-2 text-sm"><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-neon" /> {formatDate(item.startDate)}{item.endDate && item.endDate !== item.startDate ? ` a ${formatDate(item.endDate)}` : ''}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-neon" /> {item.city ?? item.location ?? 'Local a definir'}</p><p className="flex items-center gap-2"><Users className="h-4 w-4 text-neon" /> {item.enrolledParticipants ?? 0}/{item.maxParticipants ?? '—'} participantes</p></div>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4"><div><p className="text-xs text-muted">Inscrição</p><strong>{currency(item.registrationFee ?? 0)}</strong></div><div className="flex flex-wrap justify-end gap-2"><button className="ghost-button min-h-11 rounded-lg px-3 py-2 text-sm font-bold" type="button" onClick={() => void openDetail(item)}>Detalhes</button>{!isAdmin && item.status === 'INSCRICOES_ABERTAS' && !enrolled && <button className="neon-button min-h-11 rounded-lg px-3 py-2 text-sm font-black" type="button" disabled={submitting} onClick={() => void enroll(item)}>Inscrever-se</button>}{!isAdmin && enrolled && <button className="ghost-button min-h-11 rounded-lg px-3 py-2 text-sm font-bold text-neon" type="button" onClick={() => setCancelEnrollmentId(item.id)}>Inscrito</button>}</div></div>
          </div>
        </article>;
      })}
      {filtered.length === 0 && <div className="md:col-span-2 2xl:col-span-3"><EmptyState title="Nenhum campeonato encontrado" description="Ajuste os filtros ou cadastre uma nova competição." actionLabel={isAdmin ? 'Novo campeonato' : undefined} onAction={isAdmin ? openCreate : undefined} /></div>}
    </section>

    <Modal title={draft.id ? 'Editar campeonato' : 'Novo campeonato'} open={formOpen} onClose={() => setFormOpen(false)} maxWidth="max-w-4xl">
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold md:col-span-2">Nome<input className="app-input" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} maxLength={255} required /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">Descrição<textarea className="app-input min-h-24 resize-y" value={draft.description ?? ''} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} maxLength={1600} required /></label>
          <label className="grid gap-2 text-sm font-bold">Modalidade<select className="app-input" value={draft.modality} onChange={(event) => { const next = event.target.value as Modality; const court = state.courts.find((item) => item.modality === next); setDraft((current) => ({ ...current, modality: next, courtId: court?.id ?? '', courtName: court?.name ?? '', location: court?.name ?? current.location })); }}>{modalities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold">Quadra<select className="app-input" value={draft.courtId ?? ''} onChange={(event) => { const court = state.courts.find((item) => item.id === event.target.value); setDraft((current) => ({ ...current, courtId: event.target.value, courtName: court?.name, location: current.location || court?.name })); }} required><option value="">Selecione</option>{state.courts.filter((court) => court.modality === draft.modality).map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold">Local<input className="app-input" value={draft.location ?? ''} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} required /></label><label className="grid gap-2 text-sm font-bold">Cidade<input className="app-input" value={draft.city ?? ''} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} required /></label>
          <label className="grid gap-2 text-sm font-bold">Início<input className="app-input" type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} required /></label><label className="grid gap-2 text-sm font-bold">Término<input className="app-input" type="date" value={draft.endDate ?? ''} onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))} required /></label><label className="grid gap-2 text-sm font-bold">Prazo de inscrição<input className="app-input" type="date" value={draft.registrationDeadline ?? ''} onChange={(event) => setDraft((current) => ({ ...current, registrationDeadline: event.target.value }))} required /></label><label className="grid gap-2 text-sm font-bold">Limite de participantes<input className="app-input" type="number" min="2" max="500" value={draft.maxParticipants ?? 16} onChange={(event) => setDraft((current) => ({ ...current, maxParticipants: Number(event.target.value) }))} required /></label>
          <label className="grid gap-2 text-sm font-bold">Formato<input className="app-input" value={draft.format ?? ''} onChange={(event) => setDraft((current) => ({ ...current, format: event.target.value }))} required /></label><label className="grid gap-2 text-sm font-bold">Categoria<input className="app-input" value={draft.categories} onChange={(event) => setDraft((current) => ({ ...current, categories: event.target.value }))} /></label><label className="grid gap-2 text-sm font-bold">Valor da inscrição<input className="app-input" type="number" min="0" step="0.01" value={draft.registrationFee ?? 0} onChange={(event) => setDraft((current) => ({ ...current, registrationFee: Number(event.target.value) }))} /></label><label className="grid gap-2 text-sm font-bold">Premiação<input className="app-input" value={draft.prize} onChange={(event) => setDraft((current) => ({ ...current, prize: event.target.value }))} required /></label>
          <label className="grid gap-2 text-sm font-bold md:col-span-2">Regulamento<textarea className="app-input min-h-32 resize-y" value={draft.regulation} onChange={(event) => setDraft((current) => ({ ...current, regulation: event.target.value }))} maxLength={6000} required /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">Tabela ou confrontos (um por linha)<textarea className="app-input min-h-24 resize-y" value={draft.bracket.join('\n')} onChange={(event) => setDraft((current) => ({ ...current, bracket: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean) }))} /></label>
          {!draft.id && <label className="grid gap-2 text-sm font-bold">Status inicial<select className="app-input" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option value="RASCUNHO">Rascunho</option><option value="INSCRICOES_ABERTAS">Inscrições abertas</option></select></label>}
        </div>
        {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2"><button className="ghost-button min-h-11 rounded-lg px-4 py-2 font-bold" type="button" onClick={() => setFormOpen(false)}>Cancelar</button><button className="neon-button min-h-11 rounded-lg px-4 py-2 font-black disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar campeonato'}</button></div>
      </form>
    </Modal>

    <Modal title={detail?.name ?? 'Detalhes do campeonato'} open={Boolean(detail)} onClose={() => { setDetailId(''); setError(''); }} maxWidth="max-w-4xl">
      {detail && <div className="grid gap-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black uppercase text-neon">{detail.modality}</p><p className="mt-2 max-w-2xl leading-7 text-muted">{detail.description}</p></div><Status value={detail.status} /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Período', `${formatDate(detail.startDate)} — ${formatDate(detail.endDate)}`], ['Inscrições até', formatDate(detail.registrationDeadline)], ['Participantes', `${detail.enrolledParticipants ?? participants.length}/${detail.maxParticipants ?? '—'}`], ['Valor', currency(detail.registrationFee ?? 0)]].map(([label, value]) => <div key={label} className="soft-panel rounded-lg p-3"><p className="text-xs text-muted">{label}</p><strong className="mt-1 block text-sm">{value}</strong></div>)}</div>
        <section><h3 className="font-black">Regulamento</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted">{detail.regulation}</p></section>
        <section><h3 className="font-black">Tabela e confrontos</h3><div className="mt-3 grid gap-2">{detail.bracket.length ? detail.bracket.map((round, index) => <div key={`${round}-${index}`} className="soft-panel rounded-lg p-3 text-sm"><span className="mr-2 font-black text-neon">{index + 1}.</span>{round}</div>) : <p className="text-sm text-muted">A tabela será publicada pela organização.</p>}</div></section>
        <section><h3 className="font-black">Participantes</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{participants.map((entry) => <div key={entry.id} className="soft-panel flex items-center gap-3 rounded-lg p-3"><Avatar name={entry.playerName} src={entry.playerAvatarUrl} size={36} /><div><p className="font-bold">{entry.playerName}</p><p className="text-xs text-muted">Inscrição ativa</p></div></div>)}{participants.length === 0 && <p className="text-sm text-muted">Nenhum participante disponível nesta visualização.</p>}</div></section>
        {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}
        {isAdmin ? <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><div className="flex flex-wrap gap-2">{transitions[detail.status]?.map((target) => <button key={target} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-black ${target === 'CANCELADO' ? 'border border-rose-400/35 bg-rose-400/10 text-[var(--danger)]' : 'ghost-button'}`} type="button" disabled={submitting} onClick={() => void updateStatus(target)}>{statusLabels[target]}</button>)}</div><div className="flex gap-2">{!['CONCLUIDO', 'CANCELADO'].includes(detail.status) && <button className="ghost-button inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold" type="button" onClick={() => openEdit(detail)}><Edit3 className="h-4 w-4" /> Editar</button>}{['RASCUNHO', 'CANCELADO'].includes(detail.status) && <button className="ghost-button inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[var(--danger)]" type="button" onClick={() => setDeleteId(detail.id)}><Trash2 className="h-4 w-4" /> Excluir</button>}</div></div>
          : <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">{(detail.currentUserEnrolled || state.championshipEnrollments.some((entry) => entry.championshipId === detail.id && entry.playerId === user.id && entry.status === 'ATIVA')) ? <button className="ghost-button min-h-11 rounded-lg px-4 py-2 font-bold text-[var(--danger)]" type="button" onClick={() => setCancelEnrollmentId(detail.id)}>Cancelar inscrição</button> : detail.status === 'INSCRICOES_ABERTAS' && <button className="neon-button min-h-11 rounded-lg px-4 py-2 font-black" type="button" onClick={() => void enroll(detail)}>Realizar inscrição</button>}</div>}
      </div>}
    </Modal>

    <ConfirmDialog open={Boolean(deleteId)} title="Excluir campeonato?" description="O campeonato será removido permanentemente. Apenas rascunhos ou eventos cancelados sem inscrições ativas podem ser excluídos." confirmLabel="Excluir campeonato" onClose={() => setDeleteId('')} onConfirm={async () => { await removeChampionship(deleteId, user); setDeleteId(''); setDetailId(''); setToast('Campeonato excluído.'); }} />
    <ConfirmDialog open={Boolean(cancelEnrollmentId)} title="Cancelar inscrição?" description="Sua vaga será liberada para outro jogador. O cancelamento só é permitido antes do início do campeonato." confirmLabel="Cancelar inscrição" onClose={() => setCancelEnrollmentId('')} onConfirm={async () => { await cancelChampionshipEnrollment(cancelEnrollmentId, user); setCancelEnrollmentId(''); setToast('Inscrição cancelada.'); }} />
    <Toast message={toast} onClose={() => setToast('')} />
  </>;
}
