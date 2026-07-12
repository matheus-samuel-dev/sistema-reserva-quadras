import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppData } from './AppDataContext';
import { ApiRequestError, getCurrentUser, loginWithApi, remoteApiEnabled } from '../lib/api';
import { initialState } from '../lib/demoData';
import type { Role, User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  switchAccount: (role: Role) => Promise<User>;
  sessionSource: 'api' | 'demo';
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
}

const SESSION_KEY = 'playspace-session-v2';
const LEGACY_SESSION_KEY = 'playspace-session-v1';
const AuthContext = createContext<AuthContextValue | null>(null);

const clearStoredSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
};

const assertCurrentOperation = (operation: number, current: number) => {
  if (operation !== current) {
    throw new DOMException('A solicitação de acesso foi substituída por uma sessão mais recente.', 'AbortError');
  }
};

const readSession = () => {
  try {
    const stored = localStorage.getItem(SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
    return stored ? JSON.parse(stored) as { user?: User; token?: string; source?: 'api' | 'demo' } : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: PropsWithChildren) {
  const { demoCredentials, hydrateFromApi, resetSessionData } = useAppData();
  const initialSession = useMemo(readSession, []);
  const [user, setUser] = useState<User | null>(() => initialSession?.user ?? null);
  const [token, setToken] = useState<string | null>(() => initialSession?.token ?? null);
  const [sessionSource, setSessionSource] = useState<'api' | 'demo'>(() => initialSession?.source ?? (initialSession?.token?.startsWith('demo-') ? 'demo' : 'api'));
  const [sessionExpired, setSessionExpired] = useState(false);
  const hydratedToken = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(initialSession?.token ?? null);
  const authGeneration = useRef(0);

  const beginSessionTransition = useCallback(() => {
    const generation = ++authGeneration.current;
    tokenRef.current = null;
    hydratedToken.current = null;
    clearStoredSession();
    setUser(null);
    setToken(null);
    setSessionSource('demo');
    setSessionExpired(false);
    resetSessionData();
    return generation;
  }, [resetSessionData]);

  const commitSession = useCallback((nextUser: User, nextToken: string, source: 'api' | 'demo') => {
    tokenRef.current = nextToken;
    hydratedToken.current = nextToken;
    setUser(nextUser);
    setToken(nextToken);
    setSessionSource(source);
    setSessionExpired(false);
  }, []);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, source: sessionSource }));
      localStorage.removeItem(LEGACY_SESSION_KEY);
    } else {
      clearStoredSession();
    }
  }, [sessionSource, token, user]);

  useEffect(() => {
    const expire = (event: Event) => {
      const expiredToken = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (expiredToken && expiredToken !== tokenRef.current) return;
      beginSessionTransition();
      setSessionExpired(true);
    };
    window.addEventListener('playspace:session-expired', expire);
    return () => window.removeEventListener('playspace:session-expired', expire);
  }, [beginSessionTransition]);

  useEffect(() => {
    if (!remoteApiEnabled || !token || !user || sessionSource !== 'api' || hydratedToken.current === token) return;
    const generation = ++authGeneration.current;
    hydratedToken.current = token;
    resetSessionData();
    getCurrentUser(token)
      .then(async (current) => {
        if (generation !== authGeneration.current) return;
        setUser(current);
        await hydrateFromApi(token, current);
      })
      .catch(() => {
        if (generation !== authGeneration.current) return;
        beginSessionTransition();
        setSessionExpired(true);
      });
  }, [beginSessionTransition, hydrateFromApi, resetSessionData, sessionSource, token, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const generation = beginSessionTransition();

        if (remoteApiEnabled) {
          try {
            const authenticated = await loginWithApi(normalizedEmail, password);
            assertCurrentOperation(generation, authGeneration.current);
            commitSession(authenticated.user, authenticated.token, 'api');
            await hydrateFromApi(authenticated.token, authenticated.user);
            assertCurrentOperation(generation, authGeneration.current);
            return authenticated.user;
          } catch (error) {
            const apiUnavailable = error instanceof ApiRequestError && (error.status === 0 || error.status >= 500);
            if (!apiUnavailable) throw error;
          }
        }

        assertCurrentOperation(generation, authGeneration.current);
        const found = initialState.users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
        const expectedPassword = demoCredentials[normalizedEmail as keyof typeof demoCredentials];
        if (!found || !found.active || !expectedPassword || password !== expectedPassword) throw new Error('Credenciais inválidas ou usuário inativo.');
        const generatedToken = `demo-jwt-${found.role.toLowerCase()}-${Date.now()}`;
        commitSession(found, generatedToken, 'demo');
        return found;
      },
      logout: () => {
        beginSessionTransition();
      },
      switchAccount: async (role) => {
        const email = role === 'ADMIN' ? 'admin@playspace.com' : 'cliente@playspace.com';
        const password = role === 'ADMIN' ? 'Admin@123' : 'Cliente@123';
        const normalizedEmail = email.toLowerCase();
        const generation = beginSessionTransition();

        if (remoteApiEnabled) {
          try {
            const authenticated = await loginWithApi(normalizedEmail, password);
            assertCurrentOperation(generation, authGeneration.current);
            commitSession(authenticated.user, authenticated.token, 'api');
            await hydrateFromApi(authenticated.token, authenticated.user);
            assertCurrentOperation(generation, authGeneration.current);
            return authenticated.user;
          } catch (error) {
            const apiUnavailable = error instanceof ApiRequestError && (error.status === 0 || error.status >= 500);
            if (!apiUnavailable) throw error;
          }
        }

        assertCurrentOperation(generation, authGeneration.current);
        const found = initialState.users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
        if (!found || !found.active) throw new Error('Conta demo indisponível.');
        const generatedToken = `demo-jwt-${found.role.toLowerCase()}-${Date.now()}`;
        commitSession(found, generatedToken, 'demo');
        return found;
      },
      sessionSource,
      sessionExpired,
      dismissSessionExpired: () => setSessionExpired(false)
    }),
    [beginSessionTransition, commitSession, demoCredentials, hydrateFromApi, sessionExpired, sessionSource, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}

export function ProtectedRoute({ children, roles }: PropsWithChildren<{ roles?: Role[] }>) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace state={{ from: location, role: user.role }} />;
  }
  return <>{children}</>;
}
