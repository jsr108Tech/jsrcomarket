"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { db, firebaseEnabled, readFirestoreDocument, writeFirestoreDocument } from "@/components/firebase";
import type { AppUser } from "@/components/types";

const USERS_STORAGE_KEY = "jsr-grocery-users-v1";
const SESSION_STORAGE_KEY = "jsr-grocery-session-v1";

const DEFAULT_USERS: AppUser[] = [
  { id: "admin-1", name: "Admin", phone: "admin", pin: "JSR108", role: "admin", active: true },
  // { id: "user-1", name: "Asha", phone: "9999999999", pin: "1234", role: "user", active: true },
  // { id: "user-2", name: "Ravi", phone: "8888888888", pin: "4321", role: "user", active: true },
];

type AuthContextValue = {
  users: AppUser[];
  currentUser: AppUser | null;
  isAdmin: boolean;
  login: (phone: string, pin: string) => AppUser | null;
  register: (name: string, phone: string, pin: string) => AppUser | null;
  addUser: (name: string, phone: string, pin: string) => AppUser | null;
  toggleUserActive: (userId: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredUsers = async (): Promise<AppUser[]> => {
  if (firebaseEnabled && db) {
    try {
      const data = await readFirestoreDocument<{ users?: AppUser[] }>("app", "users");
      if (Array.isArray(data?.users) && data.users.length) {
        return data.users;
      }
    } catch {
      // ignore Firebase runtime issues and fall back to local storage
    }
  }

  if (typeof window === "undefined") {
    return DEFAULT_USERS;
  }

  try {
    const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }

    const parsed = JSON.parse(stored) as AppUser[];
    return parsed.length ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
};

const readStoredSession = async (): Promise<AppUser | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as AppUser;
    return parsed ?? null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const syncUsersToStorage = useCallback((nextUsers: AppUser[]) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
    }

    if (firebaseEnabled && db) {
      writeFirestoreDocument("app", "users", { users: nextUsers });
    }
  }, []);

  const syncSessionToStorage = useCallback((nextUser: AppUser | null) => {
    if (typeof window !== "undefined") {
      if (!nextUser) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      } else {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
      }
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const hydrate = async () => {
      const storedUsers = await readStoredUsers();
      const storedSession = await readStoredSession();

      if (!ignore) {
        setUsers(storedUsers);
        setCurrentUser(storedSession);
        setHydrated(true);
      }
    };

    hydrate();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    syncUsersToStorage(users);
  }, [hydrated, syncUsersToStorage, users]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    syncSessionToStorage(currentUser);
  }, [currentUser, hydrated, syncSessionToStorage]);

  const login = useCallback(
    (phone: string, pin: string) => {
      const normalizedPhone = phone.trim();
      const normalizedPin = pin.trim();

      const adminMatch =
        normalizedPhone === "admin" && normalizedPin === "JSR108"
          ? users.find((user) => user.role === "admin")
          : null;

      if (adminMatch && adminMatch.active) {
        setCurrentUser(adminMatch);
        syncSessionToStorage(adminMatch);
        return adminMatch;
      }

      const matchedUser = users.find(
        (user) => user.phone === normalizedPhone && user.pin === normalizedPin && user.active,
      );

      if (matchedUser) {
        setCurrentUser(matchedUser);
        syncSessionToStorage(matchedUser);
        return matchedUser;
      }

      return null;
    },
    [syncSessionToStorage, users],
  );

  const register = useCallback(
    (name: string, phone: string, pin: string) => {
      const cleanName = name.trim();
      const cleanPhone = phone.trim();
      const cleanPin = pin.trim();

      if (!cleanName || !cleanPhone || !cleanPin || cleanPin.length !== 4) {
        return null;
      }

      const phoneExists = users.some((user) => user.phone === cleanPhone);
      if (phoneExists) {
        return null;
      }

      const createdUser: AppUser = {
        id: crypto.randomUUID(),
        name: cleanName,
        phone: cleanPhone,
        pin: cleanPin,
        role: "user",
        active: true,
      };

      const nextUsers = [...users, createdUser];
      setUsers(nextUsers);
      syncUsersToStorage(nextUsers);
      setCurrentUser(createdUser);
      syncSessionToStorage(createdUser);
      return createdUser;
    },
    [syncSessionToStorage, syncUsersToStorage, users],
  );

  const addUser = useCallback(
    (name: string, phone: string, pin: string) => {
      return register(name, phone, pin);
    },
    [register],
  );

  const toggleUserActive = useCallback(
    (userId: string) => {
      setUsers((prev) => {
        const nextUsers = prev.map((user) =>
          user.id === userId
            ? { ...user, active: !user.active }
            : user,
        );

        syncUsersToStorage(nextUsers);
        return nextUsers;
      });
    },
    [syncUsersToStorage],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    syncSessionToStorage(null);
  }, [syncSessionToStorage]);

  const value = useMemo<AuthContextValue>(
    () => ({
      users,
      currentUser,
      isAdmin: currentUser?.role === "admin",
      login,
      register,
      addUser,
      toggleUserActive,
      logout,
    }),
    [addUser, currentUser, login, logout, register, toggleUserActive, users],
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
