"use client";

import { useEffect, useMemo, useState } from "react";

import { ARCHIVE_RETENTION_MONTHS, BASE_CATALOG } from "@/components/catalog";
import { ArchiveListView } from "@/components/archive-list-view";
import {
  database,
  db,
  firebaseEnabled,
  readFirestoreDocument,
  readRealtimeDocument,
  subscribeRealtimeDocument,
  writeFirestoreDocument,
  writeRealtimeDocument,
} from "@/components/firebase";
import { ExportToolbar } from "@/components/export-toolbar";
import { ItemCatalogModal } from "@/components/item-catalog-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { UserManagementPanel } from "@/components/user-management-panel";
import { WeeklyHeader } from "@/components/weekly-header";
import { WeeklyMatrixTable } from "@/components/weekly-matrix-table";
import type { AppUser, CatalogItem, WeeklyRow, WeeklySnapshot } from "@/components/types";

const STATE_STORAGE_KEY = "jsr-grocery-state-v1";
const ARCHIVE_STORAGE_KEY = "jsr-grocery-archives-v1";

function makeEntryMap(users: AppUser[]) {
  return users
    .filter((user) => user.role !== "admin")
    .reduce<Record<string, { quantity: number; cost: number }>>((acc, user) => {
      acc[user.id] = { quantity: 0, cost: 0 };
      return acc;
    }, {});
}

function createDefaultRows(users: AppUser[]): WeeklyRow[] {
  return BASE_CATALOG.slice(0, 5).map((item, index) => ({
    id: `row-${item.id}-${index}`,
    itemId: item.id,
    name: item.name,
    description: item.description,
    smallImage: item.smallImage,
    quantityType: item.quantityType,
    totalQuantity: 0,
    totalAmount: 0,
    rowNote: "",
    entries: makeEntryMap(users),
  }));
}

function ensureRowEntries(rows: WeeklyRow[], users: AppUser[]) {
  return rows.map((row) => {
    const nextEntries = { ...makeEntryMap(users), ...row.entries };

    return {
      ...row,
      entries: nextEntries,
      totalQuantity: row.totalQuantity ?? Object.values(nextEntries).reduce((sum, entry) => sum + entry.quantity, 0),
      totalAmount: row.totalAmount ?? Object.values(nextEntries).reduce((sum, entry) => sum + entry.cost, 0),
    };
  });
}

function distributeAdminPurchase(row: WeeklyRow): WeeklyRow {
  const orderedTotal = Object.values(row.entries).reduce((sum, entry) => sum + (entry.quantity ?? 0), 0);
  const actualAmount = Number(row.totalAmount ?? 0);

  if (!orderedTotal || actualAmount <= 0) {
    return row;
  }

  const nextEntries = Object.fromEntries(
    Object.entries(row.entries).map(([userId, entry]) => {
      const userQuantity = Number(entry.quantity ?? 0);
      const splitAmount = orderedTotal === 0 ? 0 : (userQuantity / orderedTotal) * actualAmount;

      return [userId, { ...entry, cost: Number(splitAmount.toFixed(2)) }];
    }),
  );

  return {
    ...row,
    entries: nextEntries,
  };
}

function isArchivedWithinRetention(snapshot: WeeklySnapshot) {
  const age = Date.now() - new Date(snapshot.archivedAt).getTime();
  const millisecondsInMonth = 30 * 24 * 60 * 60 * 1000;
  return age <= ARCHIVE_RETENTION_MONTHS * millisecondsInMonth;
}

function getStoredRows(users: AppUser[]) {
  if (typeof window === "undefined") {
    return createDefaultRows(users);
  }

  try {
    const saved = window.localStorage.getItem(STATE_STORAGE_KEY);
    if (!saved) {
      return createDefaultRows(users);
    }

    const parsed = JSON.parse(saved) as { rows?: WeeklyRow[]; comment?: string };
    if (parsed.rows && parsed.rows.length > 0) {
      return ensureRowEntries(parsed.rows, users);
    }
  } catch {
    // ignore malformed saved state
  }

  return createDefaultRows(users);
}

function getStoredComment() {
  if (typeof window === "undefined") {
    return "Fresh produce and weekly family essentials.";
  }

  try {
    const saved = window.localStorage.getItem(STATE_STORAGE_KEY);
    if (!saved) {
      return "Fresh produce and weekly family essentials.";
    }

    const parsed = JSON.parse(saved) as { rows?: WeeklyRow[]; comment?: string };
    return parsed.comment ?? "Fresh produce and weekly family essentials.";
  } catch {
    return "Fresh produce and weekly family essentials.";
  }
}

function getStoredArchives() {
  if (typeof window === "undefined") {
    return [] as WeeklySnapshot[];
  }

  try {
    const saved = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!saved) {
      return [] as WeeklySnapshot[];
    }

    const parsed = JSON.parse(saved) as WeeklySnapshot[];
    return (parsed ?? []).filter(isArchivedWithinRetention);
  } catch {
    return [] as WeeklySnapshot[];
  }
}

async function readFirebaseState(users: AppUser[]) {
  if (!firebaseEnabled || !database) {
    return {
      rows: getStoredRows(users),
      comment: getStoredComment(),
      archives: getStoredArchives(),
    };
  }

  const state = await readRealtimeDocument<{ rows?: WeeklyRow[]; comment?: string }>("grocery-state");
  const archived = await readFirestoreDocument<{ archives?: WeeklySnapshot[] }>("app", "archives");

  return {
    rows: state?.rows ? ensureRowEntries(state.rows, users) : getStoredRows(users),
    comment: state?.comment ?? getStoredComment(),
    archives: Array.isArray(archived?.archives) ? archived.archives.filter(isArchivedWithinRetention) : getStoredArchives(),
  };
}

function GroceryAppContent() {
  const { users, currentUser, isAdmin, login, register, logout, toggleUserActive, addUser } = useAuth();
  const [rows, setRows] = useState<WeeklyRow[]>(() => createDefaultRows(users));
  const [comment, setComment] = useState<string>("Fresh produce and weekly family essentials.");
  const [archives, setArchives] = useState<WeeklySnapshot[]>([]);
  const [hydrated, setHydrated] = useState(() => !firebaseEnabled || !database);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [itemFilter, setItemFilter] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const isAdminLogin = authMode === "login" && phone.trim().toLowerCase() === "admin";

  const selectedArchive = useMemo(
    () => archives.find((archive) => archive.id === selectedArchiveId) ?? null,
    [archives, selectedArchiveId],
  );

  useEffect(() => {
    let ignore = false;

    const hydrate = async () => {
      const firebaseState = await readFirebaseState(users);

      if (!ignore) {
        setRows(firebaseState.rows);
        setComment(firebaseState.comment);
        setArchives(firebaseState.archives);
        setHydrated(true);
      }
    };

    hydrate();

    if (!firebaseEnabled || !database) {
      return () => {
        ignore = true;
      };
    }

    const unsubscribe = subscribeRealtimeDocument<{ rows?: WeeklyRow[]; comment?: string }>("grocery-state", (state) => {
      if (!ignore && state) {
        setRows(ensureRowEntries(state.rows ?? getStoredRows(users), users));
        setComment(state.comment ?? getStoredComment());
      }
    });

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [users]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({ rows, comment }));

    if (firebaseEnabled && database) {
      writeRealtimeDocument("grocery-state", { rows, comment });
    }
  }, [comment, hydrated, rows]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archives));

    if (firebaseEnabled && db) {
      writeFirestoreDocument("app", "archives", { archives });
    }
  }, [archives, hydrated]);

  useEffect(() => {
    if (currentUser && !users.some((user) => user.id === currentUser.id && user.active)) {
      logout();
    }
  }, [currentUser, logout, users]);

  const displayRows = selectedArchive ? selectedArchive.rows : rows;
  const filteredRows = useMemo(() => {
    const normalized = itemFilter.trim().toLowerCase();

    if (!normalized) {
      return displayRows;
    }

    return displayRows.filter((row) => row.name.toLowerCase().includes(normalized));
  }, [displayRows, itemFilter]);
  const displayUsers = selectedArchive ? selectedArchive.users : users;
  const displayComment = selectedArchive ? selectedArchive.comment : comment;
  const totalQuantity = displayRows.reduce((sum, row) => sum + row.totalQuantity, 0);
  const totalAmount = displayRows.reduce((sum, row) => sum + row.totalAmount, 0);

  const handleAddItem = (item: CatalogItem) => {
    if (selectedArchive) {
      return;
    }

    const exists = rows.some((row) => row.itemId === item.id);
    if (exists) {
      return;
    }

    const newRow: WeeklyRow = {
      id: crypto.randomUUID(),
      itemId: item.id,
      name: item.name,
      description: item.description,
      smallImage: item.smallImage,
      quantityType: item.quantityType,
      totalQuantity: 0,
      totalAmount: 0,
      rowNote: "",
      entries: makeEntryMap(users),
    };

    setRows((prev) => [...prev, newRow]);
  };

  const handleRowChange = (rowId: string, field: "totalQuantity" | "totalAmount" | "rowNote", value: number | string) => {
    if (selectedArchive) {
      return;
    }

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const nextRow = {
          ...row,
          [field]: value,
        };

        if (field === "totalAmount") {
          return distributeAdminPurchase(nextRow as WeeklyRow);
        }

        if (field === "totalQuantity") {
          return {
            ...nextRow,
            totalQuantity: Number(value || 0),
          };
        }

        return nextRow;
      }),
    );
  };

  const handleEntryChange = (rowId: string, userId: string, field: "quantity" | "cost", value: number) => {
    if (selectedArchive) {
      return;
    }

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const nextEntries = {
          ...row.entries,
          [userId]: {
            quantity: row.entries[userId]?.quantity ?? 0,
            cost: row.entries[userId]?.cost ?? 0,
            [field]: value,
          },
        };

        const nextRow = {
          ...row,
          entries: nextEntries,
        };

        if (field === "quantity") {
          return distributeAdminPurchase(nextRow);
        }

        const totalQuantity = Object.values(nextEntries).reduce((sum, entry) => sum + (entry.quantity ?? 0), 0);
        const totalAmount = Object.values(nextEntries).reduce((sum, entry) => sum + (entry.cost ?? 0), 0);

        return {
          ...nextRow,
          totalQuantity,
          totalAmount,
        };
      }),
    );
  };

  const handleArchive = () => {
    if (!isAdmin || selectedArchive) {
      return;
    }

    const snapshot: WeeklySnapshot = {
      id: crypto.randomUUID(),
      weekLabel: `Week of ${new Date().toLocaleDateString()}`,
      archivedAt: new Date().toISOString(),
      comment,
      rows: rows.map((row) => ({ ...row, entries: { ...row.entries } })),
      users: users.map((user) => ({ ...user })),
    };

    setArchives((prev) => [snapshot, ...prev.filter(isArchivedWithinRetention)].slice(0, 6));
    setSelectedArchiveId(snapshot.id);
  };

  const handleSubmitAuth = () => {
    setAuthError("");

    if (!phone.trim() || !pin.trim()) {
      setAuthError("Please enter your phone number and PIN.");
      return;
    }

    if (authMode === "login") {
      const user = login(phone, pin);
      if (!user) {
        setAuthError("Incorrect phone number or PIN.");
      }
      return;
    }

    const created = register(name, phone, pin);
    if (!created) {
      setAuthError("Registration failed. Check your name, phone number, and 4-digit PIN.");
      return;
    }

    setName("");
    setPhone("");
    setPin("");
  };

  const handleAddUser = (nameValue: string, phoneValue: string, pinValue: string) => {
    const created = addUser(nameValue, phoneValue, pinValue);
    if (!created) {
      setAuthError("User could not be added. Please verify the details.");
    }
  };

  const authScreen = (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Jsr Market</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Weekly groceries</h1>
        </div>

        <div className="mb-5 flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              authMode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              authMode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Register
          </button>
        </div>

        {authMode === "register" && (
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
            />
          </label>
        )}

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Phone number</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="9999999999"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {isAdminLogin ? "Admin password" : "4-digit PIN"}
          </span>
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value.slice(0, isAdminLogin ? 8 : 4))}
            placeholder={isAdminLogin ? "JSR108" : "1234"}
            maxLength={isAdminLogin ? 8 : 4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
          />
        </label>

        {authError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>}

        <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
        Admin access uses phone number <span className="font-bold">admin</span> and PIN <span className="font-bold">JSR108</span> or <span className="font-bold">1234</span>.
        </div>

        <button
          type="button"
          onClick={handleSubmitAuth}
          className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {authMode === "login" ? "Login" : "Create account"}
        </button>
      </div>
    </div>
  );

  if (!currentUser) {
    return authScreen;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Signed in</p>
            <h2 className="text-xl font-bold text-slate-900">{currentUser.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              {currentUser.role}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Sign out
            </button>
          </div>
        </div>

        <WeeklyHeader
          comment={displayComment}
          users={displayUsers}
          totalQuantity={totalQuantity}
          totalAmount={totalAmount}
          isAdmin={isAdmin}
          onCommentChange={(value) => {
            if (selectedArchive) {
              return;
            }
            setComment(value);
          }}
          onArchive={handleArchive}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCatalog(true)}
              disabled={Boolean(selectedArchive)}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Add item
            </button>
            {selectedArchive && (
              <button
                type="button"
                onClick={() => setSelectedArchiveId(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Back to live board
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              <span className="font-medium text-slate-500">Filter</span>
              <input
                value={itemFilter}
                onChange={(event) => setItemFilter(event.target.value)}
                placeholder="Item name"
                className="w-28 border-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </label>
            <ExportToolbar rows={displayRows} label={selectedArchive ? selectedArchive.weekLabel : "Current weekly matrix"} archive={selectedArchive} />
          </div>
        </div>

        <UserManagementPanel
          users={users}
          isAdmin={isAdmin}
          onAddUser={handleAddUser}
          onToggleUser={toggleUserActive}
        />

        <WeeklyMatrixTable
          rows={filteredRows}
          users={displayUsers}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onRowChange={handleRowChange}
          onEntryChange={handleEntryChange}
        />

        <ArchiveListView
          archives={archives}
          selectedArchiveId={selectedArchiveId}
          onSelectArchive={(archive) => setSelectedArchiveId(archive.id)}
        />
      </div>

      <ItemCatalogModal open={showCatalog} onClose={() => setShowCatalog(false)} onAddItem={handleAddItem} />
    </div>
  );
}

export default function GroceryApp() {
  return (
    <>
      <GroceryAppContent />
    </>
  );
}
