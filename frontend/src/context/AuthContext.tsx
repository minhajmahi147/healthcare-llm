/**
 * React context that owns authentication for the whole app.
 * Stores username + isStaff so patient and admin UIs can split routes.
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
import type {
  AdminRegisterPayload,
  AuthUser,
  LoginCredentials,
  RegisterPayload,
} from '@/types/auth.types';
import { tokenStorage } from '@/utils/storage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  registerAdmin: (payload: AdminRegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const username = tokenStorage.getUsername();
    if (!username) return null;
    return { username, isStaff: tokenStorage.getIsStaff() };
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    const tokens = await authApi.login(credentials);
    const nextUser: AuthUser = {
      username: tokens.username || credentials.username,
      isStaff: Boolean(tokens.is_staff),
    };
    tokenStorage.setTokens(
      tokens.access,
      tokens.refresh,
      nextUser.username,
      nextUser.isStaff,
    );
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await authApi.register(payload);
      await login({ username: payload.username, password: payload.password });
    },
    [login],
  );

  const registerAdmin = useCallback(async (payload: AdminRegisterPayload) => {
    await authApi.registerAdmin(payload);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isStaff: Boolean(user?.isStaff),
      login,
      register,
      registerAdmin,
      logout,
    }),
    [user, login, register, registerAdmin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
