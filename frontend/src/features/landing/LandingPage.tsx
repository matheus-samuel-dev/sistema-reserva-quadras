import { CalendarCheck, CheckCircle2, Clock3, CreditCard, MessageCircle, Star, Trophy, Users, Volleyball, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import hero from '../../assets/playspace-hero.png';
import { Logo } from '../../components/Logo';
import { useAppData } from '../../contexts/AppDataContext';

export function LandingPage() {
  const { state } = useAppData();
  const featuredCourts = state.courts.slice(0, 4);

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-line bg-[var(--bg)]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
            <a href="#modalidades">Modalidades</a>
            <a href="#campeonatos">Campeonatos</a>
            <a href="#faq">FAQ</a>
          </nav>
          <Link className="neon-button rounded-lg px-4 py-2 text-sm font-black" to="/login">Entrar</Link>
        </div>
      </header>

      <section className="relative min-h-[92vh] pt-24">
        <img src={hero} alt="Quadra esportiva premium PlaySpace" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080c] via-[#05080c]/80 to-[#05080c]/20" />
        <div className="relative mx-auto flex min-h-[calc(92vh-6rem)] max-w-7xl items-center px-4 pb-16">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-sm font-bold text-neon">
              <Zap className="h-4 w-4" aria-hidden="true" />
              Plataforma premium para clubes, arenas e comunidades esportivas
            </div>
            <h1 className="text-5xl font-black leading-[1.02] text-white md:text-7xl">Seu jogo, nosso espaço</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">Reserve sua quadra de forma rápida, prática e segura. Gerencie agenda, pagamentos, comunidade, ranking, campeonatos e experiências esportivas em um único SaaS.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="neon-button rounded-lg px-6 py-3 font-black" to="/login">Reservar agora</Link>
              <a className="ghost-button rounded-lg px-6 py-3 font-black text-white" href="#quadras">Ver quadras</a>
            </div>
          </div>
        </div>
        <div className="relative -mt-20 mx-auto grid max-w-7xl gap-3 px-4 pb-10 md:grid-cols-4">
          {[
            ['Reserva online', CalendarCheck],
            ['Pagamento rápido', CreditCard],
            ['Agenda em tempo real', Clock3],
            ['Quadras disponíveis', Volleyball]
          ].map(([label, Icon]) => (
            <article key={String(label)} className="glass-panel card-hover rounded-lg p-5">
              <Icon className="h-6 w-6 text-neon" aria-hidden="true" />
              <p className="mt-4 font-black">{String(label)}</p>
              <p className="mt-2 text-sm text-muted">Fluxo funcional, responsivo e pronto para demonstração.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 md:grid-cols-4">
        {[
          ['12k+', 'reservas processadas'],
          ['97%', 'comparecimento médio'],
          ['6', 'modalidades ativas'],
          ['4.8', 'avaliação média']
        ].map(([value, label]) => (
          <div key={label} className="soft-panel rounded-lg p-6">
            <strong className="text-4xl font-black text-neon">{value}</strong>
            <p className="mt-2 text-sm font-semibold text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section id="quadras" className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-neon">Galeria de quadras</p>
            <h2 className="mt-2 text-3xl font-black">Estrutura esportiva com agenda inteligente</h2>
          </div>
          <Link className="ghost-button rounded-lg px-4 py-2 font-bold" to="/login">Ver disponibilidade</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {featuredCourts.map((court) => (
            <article key={court.id} className="glass-panel card-hover overflow-hidden rounded-lg">
              <div className="h-32" style={{ background: court.image }} />
              <div className="p-4">
                <p className="font-black">{court.name}</p>
                <p className="text-sm text-muted">{court.modality} · R$ {court.pricePerHour}/h</p>
                <p className="mt-3 flex items-center gap-1 text-sm text-amber">
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  {court.rating.toFixed(1)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="modalidades" className="mx-auto grid max-w-7xl gap-6 px-4 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm font-black uppercase text-neon">Diferenciais</p>
          <h2 className="mt-2 text-3xl font-black">Mais que reservas: comunidade esportiva</h2>
          <p className="mt-4 text-muted">Perfil esportivo, estatísticas, conquistas, ranking, feed, parceiros e campeonatos transformam o PlaySpace em um produto original para clubes modernos.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Ranking da comunidade', Trophy],
            ['Encontrar parceiros', Users],
            ['PlaySpace AI demo', MessageCircle],
            ['Notificações inteligentes', CheckCircle2]
          ].map(([label, Icon]) => (
            <div key={String(label)} className="soft-panel rounded-lg p-5">
              <Icon className="h-6 w-6 text-neon" aria-hidden="true" />
              <p className="mt-3 font-black">{String(label)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="campeonatos" className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-2">
          {state.championships.map((championship) => (
            <article key={championship.id} className="glass-panel rounded-lg p-6">
              <p className="text-sm font-bold text-neon">{championship.status}</p>
              <h3 className="mt-2 text-2xl font-black">{championship.name}</h3>
              <p className="mt-2 text-muted">{championship.modality} · {championship.categories}</p>
              <p className="mt-4 text-sm">{championship.prize}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {state.reviews.map((review) => (
            <article key={review.id} className="soft-panel rounded-lg p-5">
              <div className="flex gap-1 text-amber">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm text-muted">"{review.comment}"</p>
              <p className="mt-4 font-bold">{review.userName}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="text-3xl font-black">Perguntas frequentes</h2>
        <div className="mt-6 grid gap-3">
          {[
            ['O pagamento é real?', 'Não. O fluxo é demo, mas simula PIX e cartões com confirmação funcional.'],
            ['Existe painel admin?', 'Sim. Use admin@playspace.com e Admin@123 para acessar gestão completa.'],
            ['Cliente consegue reservar?', 'Sim. Use cliente@playspace.com e Cliente@123 para testar reserva, pagamento e cancelamento.']
          ].map(([q, a]) => (
            <details key={q} className="soft-panel rounded-lg p-4">
              <summary className="cursor-pointer font-bold">{q}</summary>
              <p className="mt-3 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="glass-panel rounded-lg p-8 text-center">
          <h2 className="text-3xl font-black">Pronto para entrar em quadra?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">Teste a experiência completa como cliente ou administrador e veja a plataforma preenchida com dados reais de demonstração.</p>
          <Link className="neon-button mt-6 inline-flex rounded-lg px-6 py-3 font-black" to="/login">Acessar demo</Link>
        </div>
      </section>
    </div>
  );
}
