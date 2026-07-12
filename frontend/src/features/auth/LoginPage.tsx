import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound, Wifi } from 'lucide-react';
import { FormEvent, KeyboardEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconField } from '../../components/IconField';
import { Logo } from '../../components/Logo';
import { Tooltip } from '../../components/Tooltip';
import { useAuth } from '../../contexts/AuthContext';

const demoAccounts = {
  ADMIN: { email: 'admin@playspace.com', password: 'Admin@123', label: 'administrador' },
  CLIENTE: { email: 'cliente@playspace.com', password: 'Cliente@123', label: 'cliente' }
} as const;

export function LoginPage() {
  const { login, sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fillAccess = (role: keyof typeof demoAccounts) => {
    const account = demoAccounts[role];
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const fallback = user.role === 'ADMIN' ? '/admin' : '/app';
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? fallback, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'));
  };

  return (
    <main className="relative grid min-h-[100dvh] place-items-center px-4 py-20 sm:py-10">
      <div className="absolute left-4 top-4">
        <Link className="ghost-button inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold" to="/">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para o site
        </Link>
      </div>

      <section className="glass-panel grid w-full max-w-5xl overflow-hidden rounded-lg md:grid-cols-[1fr_1.1fr]" aria-labelledby="login-title">
        <div className="hidden bg-[linear-gradient(135deg,rgb(var(--primary-rgb)/.16),rgb(var(--info-rgb)/.08)),radial-gradient(circle_at_30%_20%,rgb(var(--primary-rgb)/.2),transparent_24rem)] p-8 md:flex md:flex-col">
          <Logo />
          <div className="my-auto py-10">
            <p className="text-sm font-black uppercase text-neon">Operação conectada</p>
            <h1 className="mt-3 text-4xl font-black leading-tight">Sua arena inteira em uma única experiência.</h1>
            <p className="mt-4 leading-7 text-muted">Autenticação por perfil, rotas protegidas e sincronização com a API. Se o backend estiver indisponível, o modo demo local é claramente sinalizado.</p>
          </div>
          <div className="grid gap-3 text-sm">
            {(Object.keys(demoAccounts) as Array<keyof typeof demoAccounts>).map((role) => {
              const account = demoAccounts[role];
              const Icon = role === 'ADMIN' ? ShieldCheck : UserRound;
              return (
                <button
                  key={role}
                  className="app-card flex min-h-14 items-center gap-3 p-4 text-left"
                  type="button"
                  onClick={() => fillAccess(role)}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-neon/25 bg-neon/10"><Icon className="h-5 w-5 text-neon" aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <strong className="block">Preencher acesso de {account.label}</strong>
                    <span className="block truncate text-xs text-muted">{account.email}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form className="p-6 sm:p-8 md:p-10" onSubmit={submit} noValidate>
          <div className="md:hidden"><Logo /></div>
          <p className="mt-8 inline-flex items-center gap-2 text-sm font-black uppercase text-neon md:mt-0"><Wifi className="h-4 w-4" aria-hidden="true" />Acesso seguro</p>
          <h2 id="login-title" className="mt-2 text-3xl font-black">Entrar no PlaySpace</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Use um acesso demonstrativo ou suas credenciais configuradas na API.</p>

          {sessionExpired && (
            <div className="mt-5 flex items-start justify-between gap-3 rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber" role="alert">
              <span>Sua sessão expirou. Entre novamente para continuar.</span>
              <button className="font-black underline" type="button" onClick={dismissSessionExpired}>Fechar</button>
            </div>
          )}

          <IconField
            id="login-email"
            wrapperClassName="mt-7"
            label="E-mail"
            leadingIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            disabled={submitting}
            required
            error={error ? 'Verifique o e-mail e a senha informados.' : undefined}
          />

          <IconField
            id="login-password"
            wrapperClassName="mt-4"
            label="Senha"
            leadingIcon={<Lock className="h-4 w-4" />}
            trailingIcon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            trailingIconLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            onTrailingIconClick={() => setShowPassword((value) => !value)}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={updateCapsLock}
            onKeyUp={updateCapsLock}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            disabled={submitting}
            required
            hint={capsLock ? 'Caps Lock está ativado.' : undefined}
          />

          {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-[var(--danger)]" role="alert" aria-live="assertive">{error}</p>}

          <button className="neon-button mt-6 min-h-12 w-full rounded-lg px-5 py-3 font-black disabled:opacity-70" type="submit" disabled={submitting || !email || !password}>
            {submitting ? 'Conectando com segurança...' : 'Entrar'}
          </button>

          <div className="mt-4 grid gap-2 text-sm md:hidden">
            <button className="ghost-button min-h-11 rounded-lg px-3 py-2 font-bold" type="button" onClick={() => fillAccess('ADMIN')}>Preencher acesso de administrador</button>
            <button className="ghost-button min-h-11 rounded-lg px-3 py-2 font-bold" type="button" onClick={() => fillAccess('CLIENTE')}>Preencher acesso de cliente</button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
            <span>JWT persistido e permissões por perfil</span>
            <Tooltip content="Recuperação de senha será disponibilizada em uma próxima versão." placement="top">
              <button className="cursor-not-allowed font-semibold opacity-60" type="button" disabled>Esqueci minha senha</button>
            </Tooltip>
          </div>
        </form>
      </section>
    </main>
  );
}
