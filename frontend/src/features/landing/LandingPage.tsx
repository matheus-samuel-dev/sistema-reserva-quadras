import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Volleyball,
  Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import hero from '../../assets/playspace-hero.webp';
import { CourtImage } from '../../components/CourtImage';
import { Logo } from '../../components/Logo';
import { StatusBadge } from '../../components/StatusBadge';
import { useAppData } from '../../contexts/AppDataContext';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const benefits: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: 'Reserva online',
    description: 'Consulte horários e confirme sua quadra em poucos passos.',
    icon: CalendarCheck
  },
  {
    title: 'Pagamento rápido',
    description: 'Simule PIX, crédito ou débito com confirmação instantânea.',
    icon: CreditCard
  },
  {
    title: 'Agenda em tempo real',
    description: 'Acompanhe horários, reservas e bloqueios em uma única visão.',
    icon: Clock3
  },
  {
    title: 'Quadras para cada jogo',
    description: 'Compare modalidade, preço, estrutura e disponibilidade.',
    icon: Volleyball
  }
];

const communityFeatures: Array<{
  title: string;
  description: string;
  benefit: string;
  status: 'Disponível' | 'Demo';
  icon: LucideIcon;
  to: string;
  cta: string;
}> = [
  {
    title: 'Ranking da comunidade',
    description: 'Compare horas em quadra, frequência e evolução esportiva.',
    benefit: 'Metas que mantêm a comunidade ativa.',
    status: 'Disponível',
    icon: Trophy,
    to: '/app/ranking',
    cta: 'Conhecer ranking'
  },
  {
    title: 'Encontrar parceiros',
    description: 'Descubra jogadores por modalidade, nível, cidade e agenda.',
    benefit: 'Mais partidas com pessoas compatíveis.',
    status: 'Disponível',
    icon: Users,
    to: '/app/parceiros',
    cta: 'Encontrar parceiros'
  },
  {
    title: 'PlaySpace AI',
    description: 'Consulte tendências do seu histórico esportivo em linguagem natural.',
    benefit: 'Respostas demonstrativas com dados internos.',
    status: 'Demo',
    icon: MessageCircle,
    to: '/app/ai',
    cta: 'Testar assistente'
  },
  {
    title: 'Notificações inteligentes',
    description: 'Receba lembretes de reservas, pagamentos e conquistas.',
    benefit: 'Menos esquecimentos, mais tempo em quadra.',
    status: 'Disponível',
    icon: BellRing,
    to: '/app',
    cta: 'Ver no painel'
  }
];

const faqItems = [
  {
    question: 'Os pagamentos são reais?',
    answer: 'Não. PIX, crédito e débito fazem parte de uma experiência demonstrativa claramente identificada, sem movimentação financeira real.'
  },
  {
    question: 'Posso testar perfis diferentes?',
    answer: 'Sim. A tela de login oferece atalhos para preencher os acessos demonstrativos de administrador e cliente sem publicar senhas nesta página.'
  },
  {
    question: 'Como funciona uma reserva?',
    answer: 'Escolha a quadra, data, horário e quantidade de jogadores. O PlaySpace valida disponibilidade, calcula o total e conduz ao pagamento demonstrativo.'
  },
  {
    question: 'Quais recursos estão disponíveis na demonstração?',
    answer: 'Agenda semanal, reservas, quadras, pagamentos simulados, comunidade, ranking, campeonatos, notificações e painéis por perfil.'
  }
];

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export function LandingPage() {
  const { state } = useAppData();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const courtOrder = ['c-aurora', 'c-pulse', 'c-summit', 'c-tennis', 'c-volei', 'c-neon'];
  const featuredCourts = [...state.courts]
    .sort((a, b) => {
      const aIndex = courtOrder.indexOf(a.id);
      const bIndex = courtOrder.indexOf(b.id);
      return (aIndex < 0 ? courtOrder.length : aIndex) - (bIndex < 0 ? courtOrder.length : bIndex);
    })
    .slice(0, 6);
  const modalityCount = new Set(featuredCourts.map((court) => court.modality)).size;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#050b12]/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
          <Link to="/" aria-label="PlaySpace — início">
            <Logo onDark />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-300 lg:flex" aria-label="Navegação principal">
            <a className="transition hover:text-white" href="#quadras">Quadras</a>
            <a className="transition hover:text-white" href="#comunidade">Comunidade</a>
            <a className="transition hover:text-white" href="#campeonatos">Campeonatos</a>
            <a className="transition hover:text-white" href="#faq">FAQ</a>
          </nav>
          <Link className="neon-button shrink-0 rounded-lg px-4 py-2 text-sm font-black" to="/login">Acessar demo</Link>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[720px] overflow-hidden pt-20 sm:min-h-[760px]">
          <img
            src={hero}
            alt="Arena esportiva PlaySpace iluminada em verde"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[64%_center] sm:object-center"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,8,12,.97)_0%,rgba(5,8,12,.88)_42%,rgba(5,8,12,.35)_78%,rgba(5,8,12,.2)_100%)]" />
          <div className="mx-auto flex min-h-[640px] max-w-7xl items-center px-4 py-16 sm:min-h-[680px] sm:py-20">
            <div className="max-w-3xl animate-enter">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-neon/30 bg-[#07110c]/70 px-3 py-2 text-xs font-bold text-neon backdrop-blur sm:text-sm">
                <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Gestão esportiva, reservas e comunidade em uma experiência integrada</span>
              </div>
              <h1 className="max-w-[12ch] text-[clamp(3.4rem,9vw,6.8rem)] font-black leading-[.92] tracking-[-0.055em] text-white">
                Seu jogo, <span className="text-neon">nosso espaço</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-xl sm:leading-8">
                Encontre a quadra certa, reserve com segurança e acompanhe toda a sua jornada esportiva — da agenda à comunidade.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link className="neon-button inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-black" to="/login">
                  Reservar agora <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 py-3 font-black text-white transition hover:border-white/40 hover:bg-white/15" href="#quadras">Explorar quadras</a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                {['Dois perfis de acesso', 'Pagamentos simulados', 'Agenda integrada'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-neon" aria-hidden="true" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-10 grid max-w-7xl gap-3 px-4 sm:grid-cols-2 lg:-mt-16 lg:grid-cols-4" aria-label="Benefícios do PlaySpace">
          {benefits.map(({ title, description, icon: Icon }) => (
            <article key={title} className="glass-panel card-hover flex h-full flex-col rounded-lg p-5">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-neon/25 bg-neon/10">
                <Icon className="h-5 w-5 text-neon" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20" aria-labelledby="demo-metrics-title">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase text-neon"><BadgeCheck className="h-4 w-4" aria-hidden="true" />Transparência por padrão</p>
              <h2 id="demo-metrics-title" className="mt-2 text-3xl font-black">O que você encontra nesta demonstração</h2>
            </div>
            <span className="rounded-full border border-line bg-[var(--surface-1)] px-3 py-1 text-xs font-bold text-muted">Dados da demonstração</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [String(featuredCourts.length), 'quadras configuradas'],
              [String(modalityCount), 'modalidades disponíveis'],
              ['2', 'perfis de acesso'],
              ['3', 'formas de pagamento simuladas']
            ].map(([value, label]) => (
              <article key={label} className="soft-panel card-hover rounded-lg p-6">
                <strong className="metric-value text-4xl font-black text-neon">{value}</strong>
                <p className="mt-2 text-sm font-semibold text-muted">{label}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="quadras" className="scroll-mt-24 border-y border-line bg-[var(--surface-1)] py-16 sm:py-20" aria-labelledby="courts-title">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase text-neon">Escolha seu próximo jogo</p>
                <h2 id="courts-title" className="mt-2 text-3xl font-black sm:text-4xl">Seis espaços, seis experiências esportivas</h2>
                <p className="mt-3 text-muted">Imagens locais otimizadas, preços transparentes e disponibilidade claramente sinalizada.</p>
              </div>
              <Link className="ghost-button inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" to="/login">
                Consultar agenda <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {featuredCourts.map((court) => (
                <article key={court.id} className="glass-panel card-hover group flex h-full flex-col overflow-hidden rounded-lg">
                  <CourtImage courtId={court.id} courtName={court.name} modality={court.modality} className="border-b border-line" />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-neon">{court.modality}</p>
                        <h3 className="mt-1 truncate text-xl font-black">{court.name}</h3>
                      </div>
                      <StatusBadge status={court.status} compact />
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-muted">{court.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-line p-2 text-muted"><MapPin className="h-4 w-4 text-neon" aria-hidden="true" />{court.location}</span>
                      <span className="inline-flex items-center gap-2 rounded-lg border border-line p-2 text-muted"><ShieldCheck className="h-4 w-4 text-cyan" aria-hidden="true" />{court.covered ? 'Coberta' : 'Ao ar livre'}</span>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
                      <div>
                        <p className="text-xs text-muted">A partir de</p>
                        <strong className="text-lg text-neon">{currency(court.pricePerHour)}<span className="text-xs font-semibold text-muted">/h</span></strong>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-amber" aria-label={`Avaliação ${court.rating.toFixed(1)} de 5`}>
                        <Star className="h-4 w-4 fill-current" aria-hidden="true" /> {court.rating.toFixed(1)}
                      </span>
                    </div>
                    {court.status === 'Disponível' ? (
                      <Link className="neon-button mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black" to="/login" aria-label={`Consultar disponibilidade da ${court.name}`}>
                        Ver disponibilidade <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : (
                      <p className="mt-4 rounded-lg border border-amber/30 bg-amber/10 px-4 py-2.5 text-center text-sm font-bold text-amber">Temporariamente indisponível</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="comunidade" className="scroll-mt-24 mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-start" aria-labelledby="community-title">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-black uppercase text-neon">Além da reserva</p>
            <h2 id="community-title" className="mt-2 text-3xl font-black sm:text-4xl">Uma comunidade que joga junto</h2>
            <p className="mt-4 max-w-xl leading-7 text-muted">Perfil esportivo, parceiros, ranking e recomendações transformam horários livres em novas partidas.</p>
            <Link className="ghost-button mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold" to="/login">
              Entrar na comunidade <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {communityFeatures.map(({ title, description, benefit, status, icon: Icon, to, cta }) => (
              <article key={title} className="soft-panel card-hover flex h-full flex-col rounded-lg p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg border border-neon/25 bg-neon/10">
                    <Icon className="h-5 w-5 text-neon" aria-hidden="true" />
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${status === 'Demo' ? 'border-cyan/30 bg-cyan/10 text-cyan' : 'border-neon/30 bg-neon/10 text-neon'}`}>{status}</span>
                </div>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                <p className="mt-4 inline-flex items-start gap-2 text-sm font-semibold"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-neon" aria-hidden="true" />{benefit}</p>
                <Link className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-neon hover:underline" to={to}>
                  {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section id="campeonatos" className="scroll-mt-24 border-y border-line bg-[var(--surface-1)] py-16 sm:py-20" aria-labelledby="championships-title">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 max-w-3xl">
              <p className="text-sm font-black uppercase text-neon">Competição com contexto</p>
              <h2 id="championships-title" className="mt-2 text-3xl font-black sm:text-4xl">Campeonatos para todos os ritmos</h2>
              <p className="mt-3 text-muted">Acompanhe modalidade, categoria, formato e premiação antes de acessar a experiência demonstrativa.</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {state.championships.map((championship) => {
                const relatedCourt = featuredCourts.find((court) => court.modality === championship.modality) ?? featuredCourts[0];
                return (
                  <article key={championship.id} className="glass-panel card-hover grid overflow-hidden rounded-lg sm:grid-cols-[.8fr_1.2fr]">
                    {relatedCourt && <CourtImage courtId={relatedCourt.id} courtName={relatedCourt.name} modality={championship.modality} className="h-full min-h-56 border-b border-line sm:border-b-0 sm:border-r" />}
                    <div className="flex flex-col p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${championship.status === 'Inscrições abertas' ? 'border-neon/30 bg-neon/10 text-neon' : 'border-cyan/30 bg-cyan/10 text-cyan'}`}>{championship.status}</span>
                        <time className="text-xs font-bold text-muted" dateTime={championship.startDate}>{new Date(`${championship.startDate}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</time>
                      </div>
                      <p className="mt-5 text-xs font-black uppercase text-neon">{championship.modality}</p>
                      <h3 className="mt-1 text-2xl font-black">{championship.name}</h3>
                      <p className="mt-2 text-sm text-muted">{championship.categories}</p>
                      <p className="mt-4 text-sm leading-6">{championship.regulation}</p>
                      <div className="mt-4 rounded-lg border border-line bg-[var(--surface-1)] p-3 text-sm">
                        <span className="block text-xs font-semibold text-muted">Premiação</span>
                        <strong>{championship.prize}</strong>
                      </div>
                      <Link className="ghost-button mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black" to="/app/campeonatos">
                        Ver campeonato <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20" aria-labelledby="testimonials-title">
          <div className="mb-8 text-center">
            <p className="text-sm font-black uppercase text-neon">Experiência percebida</p>
            <h2 id="testimonials-title" className="mt-2 text-3xl font-black sm:text-4xl">Quem joga, recomenda</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {state.reviews.map((review) => {
              const court = state.courts.find((item) => item.name === review.courtName);
              return (
                <article key={review.id} className="soft-panel card-hover flex h-full flex-col rounded-lg p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-4xl font-black leading-none text-neon/40" aria-hidden="true">“</span>
                    <span className="inline-flex items-center gap-1 text-sm font-black text-amber" aria-label={`Nota ${review.average.toFixed(1)} de 5`}>
                      <Star className="h-4 w-4 fill-current" aria-hidden="true" />{review.average.toFixed(1)}
                    </span>
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-7 text-muted">{review.comment}</blockquote>
                  <footer className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-neon/25 bg-neon/10 text-sm font-black text-neon" aria-hidden="true">{initials(review.userName)}</div>
                    <div className="min-w-0">
                      <p className="truncate font-black">{review.userName}</p>
                      <p className="truncate text-xs text-muted">{court?.modality ?? 'Comunidade PlaySpace'} · {review.courtName}</p>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 mx-auto max-w-4xl px-4 py-16 sm:py-20" aria-labelledby="faq-title">
          <div className="text-center">
            <p className="text-sm font-black uppercase text-neon">Antes de começar</p>
            <h2 id="faq-title" className="mt-2 text-3xl font-black sm:text-4xl">Perguntas frequentes</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">Informações claras sobre o que é funcional e o que faz parte da demonstração.</p>
          </div>
          <div className="mt-8 grid gap-3">
            {faqItems.map((item, index) => {
              const expanded = openFaq === index;
              const buttonId = `faq-button-${index}`;
              const panelId = `faq-panel-${index}`;
              return (
                <article key={item.question} className="soft-panel overflow-hidden rounded-lg">
                  <h3>
                    <button
                      id={buttonId}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left font-black"
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => setOpenFaq(expanded ? null : index)}
                    >
                      {item.question}
                      <ChevronDown className={`h-5 w-5 shrink-0 text-neon transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                  </h3>
                  {expanded && (
                    <div id={panelId} className="animate-enter border-t border-line px-5 py-4" role="region" aria-labelledby={buttonId}>
                      <p className="text-sm leading-7 text-muted">{item.answer}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:pb-20">
          <div className="glass-panel overflow-hidden rounded-lg p-7 text-center sm:p-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-neon/30 bg-neon/10 shadow-glow">
              <CalendarCheck className="h-6 w-6 text-neon" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-3xl font-black sm:text-4xl">Pronto para entrar em quadra?</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-muted">Escolha um perfil demonstrativo e explore os fluxos de reserva, gestão e comunidade do PlaySpace.</p>
            <Link className="neon-button mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-black" to="/login">
              Acessar demonstração <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-[var(--panel-soft)]" aria-label="Rodapé">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted">Reservas, agenda e comunidade esportiva em uma experiência SaaS demonstrativa para arenas e jogadores.</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs font-bold text-amber">
              <CreditCard className="h-4 w-4" aria-hidden="true" />Pagamentos exclusivamente simulados
            </div>
          </div>
          <div>
            <h2 className="text-sm font-black uppercase text-neon">Navegação</h2>
            <nav className="mt-4 grid gap-3 text-sm text-muted" aria-label="Navegação do rodapé">
              <a className="flex min-h-11 items-center rounded-md hover:text-[var(--text)] sm:min-h-0" href="#quadras">Quadras</a>
              <a className="flex min-h-11 items-center rounded-md hover:text-[var(--text)] sm:min-h-0" href="#comunidade">Comunidade</a>
              <a className="flex min-h-11 items-center rounded-md hover:text-[var(--text)] sm:min-h-0" href="#campeonatos">Campeonatos</a>
              <a className="flex min-h-11 items-center rounded-md hover:text-[var(--text)] sm:min-h-0" href="#faq">FAQ</a>
              <Link className="flex min-h-11 items-center rounded-md font-bold text-neon sm:min-h-0" to="/login">Acesso demo</Link>
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-black uppercase text-neon">Modalidades</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted">
              {Array.from(new Set(featuredCourts.map((court) => court.modality))).map((modality) => <li key={modality}>{modality}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-black uppercase text-neon">Projeto</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted">
              {['GitHub do projeto', 'Portfólio do desenvolvedor'].map((label) => (
                <span key={label} className="flex flex-wrap items-center justify-between gap-2" aria-disabled="true" title="URL não configurada">
                  {label}<span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-black uppercase">Indisponível</span>
                </span>
              ))}
              <span>Política de privacidade <small className="text-xs">(demonstrativa)</small></span>
              <span>Termos de uso <small className="text-xs">(demonstrativos)</small></span>
            </div>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} PlaySpace. Projeto demonstrativo para portfólio.</p>
            <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-neon" aria-hidden="true" />Nenhum pagamento real é processado.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
