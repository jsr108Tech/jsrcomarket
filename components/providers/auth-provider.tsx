"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  database,
  db,
  firebaseEnabled,
  readFirestoreDocument,
  readRealtimeDocument,
  writeFirestoreDocument,
  writeRealtimeDocument,
} from "@/components/firebase";
import type { AppUser } from "@/components/types";


const USERS_STORAGE_KEY = "jsr-grocery-users-v1";
const SESSION_STORAGE_KEY = "jsr-grocery-session-v1";

const DEFAULT_USERS: AppUser[] = [
  { id: "admin-1", name: "Admin", phone: "admin", pin: "JSR108", role: "admin", active: true },
];

const normalizePhone = (value: string) => value.replace(/\D/g, "");

function ensureAdminUser(users: AppUser[]): AppUser[] {
  const adminUser = users.find((user) => user.role === "admin");

  if (adminUser) {
    return users.map((user) =>
      user.role === "admin"
        ? ({ ...user, active: user.active !== false } as AppUser)
        : user,
    );
  }

  return [
    { id: "admin-1", name: "Admin", phone: "admin", pin: "JSR108", role: "admin", active: true },
    ...users,
  ];
}

function mergeUsers(baseUsers: AppUser[], incomingUsers: AppUser[]): AppUser[] {
  const combined = [...baseUsers, ...incomingUsers];
  const map = new Map<string, AppUser>();

  for (const user of combined) {
    const key = user.id || `${user.role}:${normalizePhone(user.phone) || user.name}`;
    const normalizedUser: AppUser = {
      ...user,
      phone: normalizePhone(user.phone) || user.phone,
      role: user.role === "admin" ? "admin" : "user",
    };
    map.set(key, normalizedUser);
  }

  return ensureAdminUser(Array.from(map.values()));
}

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
  let firebaseUsers: AppUser[] = [];

  if (firebaseEnabled) {
    try {
      const firestoreData = db ? await readFirestoreDocument<{ users?: AppUser[] }>("app", "users") : null;
      const realtimeData = database ? await readRealtimeDocument<{ users?: AppUser[] }>("users") : null;

      if (Array.isArray(firestoreData?.users)) {
        firebaseUsers = firestoreData.users;
      } else if (Array.isArray(realtimeData?.users)) {
        firebaseUsers = realtimeData.users;
      }
    } catch {
      // ignore Firebase runtime issues and fall back to local storage
    }
  }

  if (typeof window === "undefined") {
    return ensureAdminUser(firebaseUsers.length ? firebaseUsers : DEFAULT_USERS);
  }

  try {
    const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as AppUser[]) : [];

    const merged = mergeUsers(ensureAdminUser(DEFAULT_USERS), [...firebaseUsers, ...parsed]);
    if (stored && parsed.length) {
      return merged;
    }

    if (firebaseUsers.length) {
      return merged;
    }

    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return ensureAdminUser(firebaseUsers.length ? firebaseUsers : DEFAULT_USERS);
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

  const syncUsersToStorage = useCallback(async (nextUsers: AppUser[]) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
    }

    if (firebaseEnabled) {
      const writeTasks: Promise<unknown>[] = [];

      if (db) {
        writeTasks.push(writeFirestoreDocument("app", "users", { users: nextUsers }));
      }

      if (database) {
        writeTasks.push(writeRealtimeDocument("users", { users: nextUsers }));
      }

      if (writeTasks.length) {
        const results = await Promise.allSettled(writeTasks);
        const failed = results.filter((result) => result.status === "rejected");

        if (failed.length) {
          console.error("[Auth] Firebase user sync failed. Local persistence still works; database rules may be blocking writes.", {
            failedCount: failed.length,
          });
        }
      }
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
      const normalizedPhone = normalizePhone(phone);
      const normalizedPin = pin.trim();

      const adminMatch =
        normalizedPhone === normalizePhone("admin") && (normalizedPin === "JSR108" || normalizedPin === "1234")
          ? users.find((user) => user.role === "admin")
          : null;

      if (adminMatch && adminMatch.active) {
        setCurrentUser(adminMatch);
        syncSessionToStorage(adminMatch);
        return adminMatch;
      }

      const matchedUser = users.find(
        (user) => normalizePhone(user.phone) === normalizedPhone && user.pin === normalizedPin && user.active,
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
      const cleanPhone = normalizePhone(phone);
      const cleanPin = pin.trim();

      if (!cleanName || !cleanPhone || !cleanPin || cleanPin.length !== 4) {
        return null;
      }

      const phoneExists = users.some((user) => normalizePhone(user.phone) === cleanPhone);
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

      const nextUsers = ensureAdminUser([...users, createdUser]);
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
