/**
 * React context that owns authentication for the whole app.
 *
 * AuthProvider wraps the tree in main.tsx. On load it restores the username from
 * localStorage so a refresh keeps the user "logged in". login() calls the backend,
 * stores JWT access/refresh tokens, and sets `user`. register() creates the account
 * then logs in. logout() clears storage and user. useAuth() is the hook pages and
 * nav use to read `isAuthenticated` and call these actions.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/api/auth.api';
import type { AuthUser, LoginCredentials, RegisterPayload } from '@/types/auth.types';
import { tokenStorage } from '@/utils/storage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const username = tokenStorage.getUsername();
    return username ? { username } : null;
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    const tokens = await authApi.login(credentials);
    tokenStorage.setTokens(tokens.access, tokens.refresh, credentials.username);
    setUser({ username: credentials.username });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
    await login({ username: payload.username, password: payload.password });
  }, [login]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
