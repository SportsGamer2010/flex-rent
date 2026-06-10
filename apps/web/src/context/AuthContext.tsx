import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, getToken, setToken, type User, type UserRole } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (role: UserRole, email?: string) => Promise<void>;
  registerLandlord: (name: string, email: string) => Promise<void>;
  registerTenant: (input: { name: string; email: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const applySession = useCallback(({ token, user }: { token: string; user: User }) => {
    setToken(token);
    setUser(user);
  }, []);

  const login = useCallback(
    async (role: UserRole, email?: string) => {
      applySession(await api.demoLogin(role, email));
    },
    [applySession],
  );

  const registerLandlord = useCallback(
    async (name: string, email: string) => {
      applySession(await api.registerLandlord(name, email));
    },
    [applySession],
  );

  const registerTenant = useCallback(
    async (input: { name: string; email: string }) => {
      applySession(await api.registerTenant(input));
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, registerLandlord, registerTenant, logout }),
    [user, loading, login, registerLandlord, registerTenant, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
