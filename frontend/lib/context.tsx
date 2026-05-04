"use client";
// frontend/lib/context.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppState, UserInfo, UserPreferences } from "./types";

const INITIAL_STATE: AppState = {
  isLoggedIn: false,
  userId: null,
  userName: null,
  userPicture: null,
  authProvider: null,
  userPreferences: null,
  topIds: [],
  sessionId: null,
};

const SESSION_KEY = "citrus_app_state";

type LoginUser = Omit<UserInfo, "isLoggedIn">;

interface AppContextValue extends AppState {
  setUserPreferences: (prefs: UserPreferences) => void;
  setTopIds: (ids: number[], sessionId: string) => void;
  loginWithLine: (user: LoginUser) => void;
  logout: () => void;
  resetDiagnosis: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return INITIAL_STATE;

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return INITIAL_STATE;

    return {
      ...INITIAL_STATE,
      ...JSON.parse(raw),
    };
  } catch {
    return INITIAL_STATE;
  }
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage が使えない環境では何もしない
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setUserPreferences = useCallback((prefs: UserPreferences) => {
    setState((prev) => ({
      ...prev,
      userPreferences: prefs,
    }));
  }, []);

  const setTopIds = useCallback((ids: number[], sessionId: string) => {
    setState((prev) => ({
      ...prev,
      topIds: ids,
      sessionId,
    }));
  }, []);

  const loginWithLine = useCallback((user: LoginUser) => {
    setState((prev) => {
      const next = {
        ...prev,
        isLoggedIn: true,
        ...user,
      };

      saveState(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLoggedIn: false,
      userId: null,
      userName: null,
      userPicture: null,
      authProvider: null,
    }));
  }, []);

  const resetDiagnosis = useCallback(() => {
    setState((prev) => ({
      ...prev,
      userPreferences: null,
      topIds: [],
      sessionId: null,
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setUserPreferences,
        setTopIds,
        loginWithLine,
        logout,
        resetDiagnosis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }

  return ctx;
}
