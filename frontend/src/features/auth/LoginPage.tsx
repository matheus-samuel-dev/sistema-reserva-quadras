import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@playspace.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const fallback = user.role === 'ADMIN' ? '/admin' : '/app';
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? fallback, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute left-4 top-4">
        <Link className="ghost-button inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold" to="/">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </Link>
      </div>
      <section className="glass-panel grid w-full max-w-5xl overflow-hidden rounded-lg md:grid-cols-[1fr_1.1fr]">
        <div className="hidden bg-[linear-gradient(135deg,rgba(124,255,79,.18),rgba(85,214,255,.08)),radial-gradient(circle_at_30%_20%,rgba(124,255,79,.2),transparent_24rem)] p-8 md:block">
          <Logo />
          <h1 className="mt-16 text-4xl font-black leading-tight">Entre no PlaySpace e gerencie toda a arena.</h1>
          <p className="mt-4 text-muted">JWT demo persistido, rotas protegidas por perfil e experiência completa para admin e cliente.</p>
          <div className="mt-10 grid gap-3 text-sm">
            <button className="app-card p-4 text-left" type="button" onClick={() => { setEmail('admin@playspace.com'); setPassword('Admin@123'); }}>
              <strong className="block text-neon">Admin</strong>
              admin@playspace.com · Admin@123
            </button>
            <button className="app-card p-4 text-left" type="button" onClick={() => { setEmail('cliente@playspace.com'); setPassword('Cliente@123'); }}>
              <strong className="block text-cyan">Cliente</strong>
              cliente@playspace.com · Cliente@123
            </button>
          </div>
        </div>
        <form className="p-6 md:p-10" onSubmit={submit}>
          <div className="md:hidden">
            <Logo />
          </div>
          <p className="mt-8 text-sm font-black uppercase text-neon md:mt-0">Acesso demo</p>
          <h2 className="mt-2 text-3xl font-black">Login</h2>
          <p className="mt-2 text-sm text-muted">Use uma das credenciais demo para acessar a área correta automaticamente.</p>

          <label className="mt-8 grid gap-2 text-sm font-semibold">
            E-mail
            <span className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input className="form-control py-3 pl-10 pr-3" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
            </span>
          </label>
          <label className="mt-4 grid gap-2 text-sm font-semibold">
            Senha
            <span className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input className="form-control py-3 pl-10 pr-3" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
            </span>
          </label>
          {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <button className="neon-button mt-6 w-full rounded-lg px-5 py-3 font-black disabled:opacity-70" type="submit" disabled={submitting}>{submitting ? 'Entrando...' : 'Entrar'}</button>
          <div className="mt-4 grid gap-2 text-sm md:hidden">
            <button className="ghost-button rounded-lg px-3 py-2" type="button" onClick={() => { setEmail('admin@playspace.com'); setPassword('Admin@123'); }}>Usar Admin</button>
            <button className="ghost-button rounded-lg px-3 py-2" type="button" onClick={() => { setEmail('cliente@playspace.com'); setPassword('Cliente@123'); }}>Usar Cliente</button>
          </div>
        </form>
      </section>
    </main>
  );
}
