import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppData } from './AppDataContext';
import type { Role, User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const SESSION_KEY = 'playspace-session-v1';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { state, demoCredentials } = useAppData();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored).user : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored).token : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user && token) localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
    else localStorage.removeItem(SESSION_KEY);
  }, [user, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login: async (email, password) => {
        const found = state.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
        const expectedPassword = demoCredentials[email as keyof typeof demoCredentials] ?? 'Cliente@123';
        if (!found || !found.active || password !== expectedPassword) {
          throw new Error('Credenciais inválidas ou usuário inativo.');
        }
        const generatedToken = `demo-jwt-${found.role.toLowerCase()}-${Date.now()}`;
        setUser(found);
        setToken(generatedToken);
        return found;
      },
      logout: () => {
        setUser(null);
        setToken(null);
      }
    }),
    [demoCredentials, state.users, token, user]
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
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
  }
  return <>{children}</>;
}
