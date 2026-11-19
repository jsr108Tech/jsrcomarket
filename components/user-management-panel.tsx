"use client";

import { useState } from "react";

import type { AppUser } from "@/components/types";

type Props = {
  users: AppUser[];
  isAdmin: boolean;
  onAddUser: (name: string, phone: string, pin: string) => void;
  onToggleUser: (userId: string) => void;
};

export function UserManagementPanel({ users, isAdmin, onAddUser, onToggleUser }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">User management</h3>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone number"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
        />
        <input
          value={pin}
          maxLength={4}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
          placeholder="4-digit PIN"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={() => {
            onAddUser(name, phone, pin);
            setName("");
            setPhone("");
            setPin("");
          }}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Add user
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div>
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {user.active ? "Active" : "Blocked"}
              </span>
              <button
                type="button"
                onClick={() => onToggleUser(user.id)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
              >
                {user.active ? "Block" : "Unblock"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
