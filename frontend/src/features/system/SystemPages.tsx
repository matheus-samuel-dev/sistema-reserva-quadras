import { AlertTriangle, CloudOff, Construction, FileQuestion, ShieldX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';

function SystemPage({ code, title, description, icon: Icon }: { code: string; title: string; description: string; icon: LucideIcon }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <section className="glass-panel w-full max-w-xl rounded-lg p-7 text-center sm:p-10">
        <div className="flex justify-center"><Logo /></div>
        <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-full border border-neon/30 bg-neon/10"><Icon className="h-7 w-7 text-neon" aria-hidden="true" /></div>
        <p className="mt-6 text-sm font-black uppercase text-neon">{code}</p>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-muted">{description}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link className="neon-button rounded-lg px-5 py-3 font-black" to="/">Voltar ao início</Link><button className="ghost-button rounded-lg px-5 py-3 font-black" onClick={() => window.history.back()}>Página anterior</button></div>
      </section>
    </main>
  );
}

export const ForbiddenPage = () => <SystemPage code="403" title="Acesso não autorizado" description="Seu perfil não possui permissão para esta área. Troque de conta ou volte ao seu painel." icon={ShieldX} />;
export const NotFoundPage = () => <SystemPage code="404" title="Página não encontrada" description="O endereço pode ter mudado ou não existe no PlaySpace." icon={FileQuestion} />;
export const ServerErrorPage = () => <SystemPage code="500" title="Algo saiu da quadra" description="Ocorreu uma falha inesperada. Tente novamente e, se persistir, consulte o status do sistema." icon={AlertTriangle} />;
export const OfflinePage = () => <SystemPage code="Offline" title="Sem conexão" description="Verifique sua internet. Dados locais podem continuar disponíveis no modo demonstração." icon={CloudOff} />;
export const MaintenancePage = () => <SystemPage code="Manutenção" title="Voltamos em breve" description="Esta área está passando por uma melhoria programada." icon={Construction} />;
