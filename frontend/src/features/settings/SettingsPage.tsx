import { Bell, Building2, CalendarClock, CreditCard, LockKeyhole, Palette, Plus, Save, TimerReset, WalletCards } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Toast } from '../../components/Toast';
import { useAppData } from '../../contexts/AppDataContext';
import type { Settings, WeekDay } from '../../lib/types';

const tabs = [
  ['empresa', 'Empresa', Building2], ['funcionamento', 'Funcionamento', CalendarClock], ['reservas', 'Reservas', TimerReset],
  ['precos', 'Preços', WalletCards], ['pagamentos', 'Pagamentos', CreditCard], ['notificacoes', 'Notificações', Bell],
  ['aparencia', 'Aparência', Palette], ['seguranca', 'Segurança', LockKeyhole]
] as const;
const days: Array<[WeekDay, string]> = [['MONDAY', 'Segunda'], ['TUESDAY', 'Terça'], ['WEDNESDAY', 'Quarta'], ['THURSDAY', 'Quinta'], ['FRIDAY', 'Sexta'], ['SATURDAY', 'Sábado'], ['SUNDAY', 'Domingo']];

const modalityIdentity = (value: string) => value
  .normalize('NFKC')
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLocaleLowerCase('pt-BR');

const Toggle = ({ checked, onChange, title, description }: { checked: boolean; onChange: (value: boolean) => void; title: string; description: string }) => <label className="soft-panel flex min-h-16 items-center gap-3 rounded-lg p-3"><input className="h-5 w-5 accent-[var(--primary)]" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><strong className="block text-sm">{title}</strong><span className="text-xs leading-5 text-muted">{description}</span></span></label>;
const Field = ({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) => <label className="grid gap-2 text-sm font-bold">{label}{children}{help && <span className="text-xs font-normal leading-5 text-muted">{help}</span>}</label>;

export function SettingsPage() {
  const { state, createModality, saveSettings } = useAppData();
  const [active, setActive] = useState<(typeof tabs)[number][0]>('empresa');
  const [draft, setDraft] = useState<Settings>(() => JSON.parse(JSON.stringify(state.settings)) as Settings);
  const [submitting, setSubmitting] = useState(false);
  const [creatingModality, setCreatingModality] = useState(false);
  const [newModality, setNewModality] = useState({ name: '', defaultPrice: 0 });
  const [modalityError, setModalityError] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const addModality = async () => {
    if (creatingModality) return;
    const name = newModality.name.trim().replace(/\s+/g, ' ');
    const defaultPrice = Number(newModality.defaultPrice);
    setModalityError('');
    if (name.length < 2 || name.length > 80) {
      setModalityError('Informe um nome entre 2 e 80 caracteres.');
      return;
    }
    if (!Number.isFinite(defaultPrice) || defaultPrice < 0) {
      setModalityError('Informe um preço padrão válido, igual ou maior que zero.');
      return;
    }
    if (state.modalityCatalog.some((item) => modalityIdentity(item.name) === modalityIdentity(name))) {
      setModalityError('Esta modalidade já está cadastrada. Você pode ativá-la ou ajustar o preço abaixo.');
      return;
    }
    setCreatingModality(true);
    try {
      const created = await createModality(name, defaultPrice);
      setDraft((current) => ({
        ...current,
        modalities: created.active && !current.modalities.includes(created.name) ? [...current.modalities, created.name] : current.modalities,
        defaultPrices: { ...current.defaultPrices, [created.name]: created.defaultPrice }
      }));
      setNewModality({ name: '', defaultPrice: 0 });
      setToast(`${created.name} adicionada ao catálogo.`);
    } catch (reason) {
      setModalityError(reason instanceof Error ? reason.message : 'Não foi possível cadastrar a modalidade.');
    } finally {
      setCreatingModality(false);
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      const opening = draft.openingTime ?? '08:00'; const closing = draft.closingTime ?? '22:00';
      if (opening >= closing) throw new Error('O horário de abertura deve ser anterior ao fechamento.');
      if (!draft.acceptPix && !draft.acceptCard && !draft.acceptCash) throw new Error('Mantenha ao menos uma forma de pagamento ativa.');
      if (draft.acceptPix && !draft.pixKey?.trim()) throw new Error('Informe a chave PIX enquanto o PIX estiver ativo.');
      const saved = await saveSettings({ ...draft, hours: `${opening} - ${closing}` }); setDraft(saved); setToast('Configurações salvas com sucesso.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar as configurações.'); }
    finally { setSubmitting(false); }
  };
  return <>
    <header className="mb-6"><p className="text-sm font-black uppercase text-neon">Administração</p><h1 className="mt-1 text-3xl font-black">Configurações</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Gerencie empresa, operação, reservas, preços, pagamentos, comunicação, identidade e segurança.</p></header>
    <form className="grid items-start gap-4 xl:grid-cols-[16rem_1fr]" onSubmit={submit}>
      <nav className="glass-panel grid grid-cols-2 gap-2 rounded-lg p-2 sm:grid-cols-4 xl:sticky xl:top-24 xl:grid-cols-1" aria-label="Seções de configuração">{tabs.map(([id, label, Icon]) => <button key={id} className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-black transition ${active === id ? 'bg-neon/12 text-neon' : 'text-muted hover:bg-white/5 hover:text-[var(--text)]'}`} type="button" onClick={() => setActive(id)} aria-current={active === id ? 'page' : undefined}><Icon className="h-4 w-4 shrink-0" />{label}</button>)}</nav>
      <section className="glass-panel min-w-0 rounded-lg p-5 sm:p-6"><div className="mb-5"><h2 className="text-xl font-black">{tabs.find(([id]) => id === active)?.[1]}</h2><p className="mt-1 text-sm text-muted">Os valores atuais são carregados automaticamente e persistidos ao salvar.</p></div>
        {active === 'empresa' && <div className="grid gap-4 md:grid-cols-2"><Field label="Nome da empresa"><input className="app-input" value={draft.company} onChange={(event) => update('company', event.target.value)} maxLength={160} required /></Field><Field label="Razão social"><input className="app-input" value={draft.legalName ?? ''} onChange={(event) => update('legalName', event.target.value)} maxLength={160} /></Field><Field label="CNPJ ou documento"><input className="app-input" value={draft.document ?? ''} onChange={(event) => update('document', event.target.value)} maxLength={30} /></Field><Field label="E-mail corporativo"><input className="app-input" type="email" value={draft.companyEmail ?? ''} onChange={(event) => update('companyEmail', event.target.value)} maxLength={254} /></Field><Field label="Telefone"><input className="app-input" value={draft.companyPhone ?? ''} onChange={(event) => update('companyPhone', event.target.value)} maxLength={30} /></Field><Field label="Endereço"><input className="app-input" value={draft.address ?? ''} onChange={(event) => update('address', event.target.value)} maxLength={255} /></Field></div>}
        {active === 'funcionamento' && <div className="grid gap-5"><div className="grid gap-4 md:grid-cols-3"><Field label="Abertura"><input className="app-input" type="time" value={draft.openingTime ?? '08:00'} onChange={(event) => update('openingTime', event.target.value)} required /></Field><Field label="Fechamento"><input className="app-input" type="time" value={draft.closingTime ?? '22:00'} onChange={(event) => update('closingTime', event.target.value)} required /></Field><Field label="Fuso horário"><select className="app-input" value={draft.timezone ?? 'America/Sao_Paulo'} onChange={(event) => update('timezone', event.target.value)}><option value="America/Sao_Paulo">Brasília (São Paulo)</option><option value="America/Manaus">Manaus</option><option value="America/Recife">Recife</option></select></Field></div><fieldset><legend className="text-sm font-bold">Dias de funcionamento</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{days.map(([value, label]) => <label key={value} className="soft-panel flex min-h-11 items-center gap-3 rounded-lg p-3 text-sm font-bold"><input className="h-5 w-5 accent-[var(--primary)]" type="checkbox" checked={(draft.operatingDays ?? []).includes(value)} onChange={(event) => update('operatingDays', event.target.checked ? [...(draft.operatingDays ?? []), value] : (draft.operatingDays ?? []).filter((day) => day !== value))} />{label}</label>)}</div></fieldset></div>}
        {active === 'reservas' && <div className="grid gap-4 md:grid-cols-2"><Field label="Antecedência para cancelamento" help="Horas mínimas antes do início da reserva."><input className="app-input" type="number" min="0" max="168" value={draft.cancelationRuleHours} onChange={(event) => update('cancelationRuleHours', Number(event.target.value))} /></Field><Field label="Duração mínima" help="Em minutos, entre 30 e 480."><input className="app-input" type="number" min="30" max="480" step="15" value={draft.minimumReservationMinutes} onChange={(event) => update('minimumReservationMinutes', Number(event.target.value))} /></Field><Field label="Antecedência máxima" help="Dias permitidos para reservas futuras."><input className="app-input" type="number" min="1" max="730" value={draft.maximumAdvanceDays ?? 90} onChange={(event) => update('maximumAdvanceDays', Number(event.target.value))} /></Field><Field label="Intervalo da grade" help="Tamanho dos slots exibidos na agenda."><select className="app-input" value={draft.slotMinutes ?? 60} onChange={(event) => update('slotMinutes', Number(event.target.value))}><option value={15}>15 minutos</option><option value={30}>30 minutos</option><option value={60}>60 minutos</option><option value={90}>90 minutos</option><option value={120}>120 minutos</option></select></Field></div>}
        {active === 'precos' && <div className="grid gap-5">
          <section className="soft-panel rounded-lg p-4" aria-labelledby="new-modality-title">
            <div><h3 id="new-modality-title" className="font-black">Cadastrar modalidade</h3><p className="mt-1 text-xs leading-5 text-muted">O nome será normalizado pelo servidor e ficará disponível automaticamente em quadras, filtros e relatórios.</p></div>
            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end">
              <Field label="Nome"><input className="app-input" value={newModality.name} onChange={(event) => { setNewModality((current) => ({ ...current, name: event.target.value })); setModalityError(''); }} maxLength={80} placeholder="Ex.: Vôlei de Areia" /></Field>
              <Field label="Preço padrão"><div className="relative"><span className="absolute left-3 top-3 text-sm font-bold text-muted">R$</span><input className="app-input w-full pl-10" type="number" min="0" step="0.01" value={newModality.defaultPrice} onChange={(event) => { setNewModality((current) => ({ ...current, defaultPrice: Number(event.target.value) })); setModalityError(''); }} /></div></Field>
              <button className="neon-button inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black disabled:opacity-60" type="button" disabled={creatingModality || !newModality.name.trim()} onClick={() => void addModality()}><Plus className="h-4 w-4" />{creatingModality ? 'Cadastrando...' : 'Adicionar'}</button>
            </div>
            {modalityError && <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{modalityError}</p>}
          </section>
          <fieldset><legend className="text-sm font-bold">Catálogo e disponibilidade</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{state.modalityCatalog.map((item) => <label key={item.code} className="soft-panel flex min-h-11 items-center gap-3 rounded-lg p-3 text-sm font-bold"><input className="h-5 w-5 accent-[var(--primary)]" type="checkbox" checked={draft.modalities.includes(item.name)} onChange={(event) => update('modalities', event.target.checked ? [...new Set([...draft.modalities, item.name])] : draft.modalities.filter((modality) => modality !== item.name))} />{item.name}</label>)}</div></fieldset>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{state.modalityCatalog.map((item) => <Field key={item.code} label={`Preço padrão · ${item.name}`}><div className="relative"><span className="absolute left-3 top-3 text-sm font-bold text-muted">R$</span><input className="app-input w-full pl-10" type="number" min="0" step="0.01" value={draft.defaultPrices[item.name] ?? item.defaultPrice} onChange={(event) => update('defaultPrices', { ...draft.defaultPrices, [item.name]: Number(event.target.value) })} disabled={!draft.modalities.includes(item.name)} /></div></Field>)}</div>
          {state.modalityCatalog.length === 0 && <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Cadastre a primeira modalidade para liberar quadras e reservas.</p>}
        </div>}
        {active === 'pagamentos' && <div className="grid gap-4"><Toggle checked={Boolean(draft.acceptPix)} onChange={(value) => update('acceptPix', value)} title="Aceitar PIX" description="Habilita o fluxo de pagamento instantâneo." /><Toggle checked={Boolean(draft.acceptCard)} onChange={(value) => update('acceptCard', value)} title="Aceitar cartões" description="Crédito e débito no fluxo demonstrativo ou gateway configurado." /><Toggle checked={Boolean(draft.acceptCash)} onChange={(value) => update('acceptCash', value)} title="Aceitar pagamento presencial" description="Registra recebimentos fora do gateway." />{draft.acceptPix && <Field label="Chave PIX" help="E-mail, telefone, CPF/CNPJ ou chave aleatória."><input className="app-input" value={draft.pixKey ?? ''} onChange={(event) => update('pixKey', event.target.value)} maxLength={254} required /></Field>}</div>}
        {active === 'notificacoes' && <div className="grid gap-4"><Toggle checked={Boolean(draft.emailNotifications)} onChange={(value) => update('emailNotifications', value)} title="Notificações por e-mail" description="Envia confirmações de reservas, pagamentos e campeonatos." /><Toggle checked={Boolean(draft.browserNotifications)} onChange={(value) => update('browserNotifications', value)} title="Notificações no navegador" description="Permite alertas em tempo real para usuários autorizados." /><Field label="Lembrete padrão de reserva"><select className="app-input" value={draft.reservationReminderHours ?? 2} onChange={(event) => update('reservationReminderHours', Number(event.target.value))}><option value={0}>Desativado</option><option value={1}>1 hora antes</option><option value={2}>2 horas antes</option><option value={6}>6 horas antes</option><option value={24}>1 dia antes</option></select></Field></div>}
        {active === 'aparencia' && <div className="grid gap-4 md:grid-cols-2"><Field label="Cor principal" help="A prévia ajuda a validar contraste antes de salvar."><div className="flex gap-2"><input className="h-12 w-16 cursor-pointer rounded-lg border border-line bg-transparent p-1" type="color" value={draft.primaryColor ?? '#0F766E'} onChange={(event) => update('primaryColor', event.target.value.toUpperCase())} /><input className="app-input min-w-0 flex-1 uppercase" pattern="#[0-9A-Fa-f]{6}" value={draft.primaryColor ?? '#0F766E'} onChange={(event) => update('primaryColor', event.target.value)} /></div></Field><Field label="Tema padrão"><select className="app-input" value={draft.defaultTheme ?? 'SYSTEM'} onChange={(event) => update('defaultTheme', event.target.value as Settings['defaultTheme'])}><option value="SYSTEM">Seguir sistema</option><option value="LIGHT">Claro</option><option value="DARK">Escuro</option></select></Field><Field label="URL do logotipo" help="Use HTTPS e uma imagem otimizada."><input className="app-input" type="url" value={draft.logoUrl ?? ''} onChange={(event) => update('logoUrl', event.target.value)} maxLength={255} placeholder="https://..." /></Field><div className="soft-panel flex min-h-24 items-center justify-center rounded-lg p-4" style={{ borderColor: draft.primaryColor }}><span className="rounded-lg px-4 py-2 font-black text-white" style={{ backgroundColor: draft.primaryColor }}>Prévia da marca</span></div></div>}
        {active === 'seguranca' && <div className="grid gap-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Tamanho mínimo da senha"><input className="app-input" type="number" min="8" max="72" value={draft.minimumPasswordLength ?? 8} onChange={(event) => update('minimumPasswordLength', Number(event.target.value))} /></Field><Field label="Duração da sessão" help="Minutos até expiração do JWT."><input className="app-input" type="number" min="15" max="10080" value={draft.sessionMinutes ?? 120} onChange={(event) => update('sessionMinutes', Number(event.target.value))} /></Field></div><Toggle checked={Boolean(draft.requireStrongPassword)} onChange={(value) => update('requireStrongPassword', value)} title="Exigir senha forte" description="Maiúscula, minúscula, número e tamanho mínimo configurado." /><Toggle checked={Boolean(draft.publicRegistrationEnabled)} onChange={(value) => update('publicRegistrationEnabled', value)} title="Permitir cadastro público" description="Novas contas públicas sempre recebem o perfil Cliente/Jogador." /></div>}
        {error && <p className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}<div className="mt-6 flex justify-end border-t border-line pt-5"><button className="neon-button inline-flex min-h-12 items-center gap-2 rounded-lg px-5 py-3 font-black disabled:opacity-60" type="submit" disabled={submitting}><Save className="h-4 w-4" />{submitting ? 'Salvando...' : 'Salvar configurações'}</button></div>
      </section>
    </form><Toast message={toast} onClose={() => setToast('')} />
  </>;
}
