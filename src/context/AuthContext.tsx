import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ensureDatabaseReady } from "../db/database";
import { getApiErrorMessage, setAuthToken } from "../services/client";
import { clearSession, readSession, writeSession } from "../services/session";
import { getCurrentUser, loginUser, registerUser } from "../services/auth";
import type { LoginPayload, RegisterPayload, User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  isBootstrapping: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        await ensureDatabaseReady();

        const session = await readSession();
        if (!session) {
          return;
        }

        setAuthToken(session.token);
        if (!isMounted) {
          return;
        }

        setToken(session.token);
        setUser(session.user);

        try {
          const freshUser = await getCurrentUser();
          if (!isMounted) {
            return;
          }

          setUser(freshUser);
          await writeSession({ token: session.token, user: freshUser });
        } catch (error) {
          await clearSession();
          setAuthToken(null);
          if (isMounted) {
            setUser(null);
            setToken(null);
            setAuthError(getApiErrorMessage(error));
          }
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(getApiErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeAuth = useCallback(async (nextToken: string, nextUser: User) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setAuthError(null);
    await writeSession({ token: nextToken, user: nextUser });
  }, []);

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      try {
        const response = await loginUser(payload);
        await completeAuth(response.token, response.user);
      } catch (error) {
        const message = getApiErrorMessage(error);
        setAuthError(message);
      }
    },
    [completeAuth],
  );

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      try {
        const response = await registerUser(payload);
        await completeAuth(response.token, response.user);
      } catch (error) {
        const message = getApiErrorMessage(error);
        setAuthError(message);
      }
    },
    [completeAuth],
  );

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setAuthError(null);
    await clearSession();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return null;
    }

    try {
      const nextUser = await getCurrentUser();
      setUser(nextUser);
      await writeSession({ token, user: nextUser });
      return nextUser;
    } catch (error) {
      const message = getApiErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      authError,
      clearAuthError: () => setAuthError(null),
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, isBootstrapping, authError, signIn, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
