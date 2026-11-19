"use client";

import type { AppUser } from "@/components/types";

type Props = {
  comment: string;
  users: AppUser[];
  totalQuantity: number;
  totalAmount: number;
  isAdmin: boolean;
  onCommentChange: (value: string) => void;
  onArchive: () => void;
};

export function WeeklyHeader({
  comment,
  users,
  totalQuantity,
  totalAmount,
  isAdmin,
  onCommentChange,
  onArchive,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Weekly grocery</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Collaborative order board</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span className="font-semibold">{users.filter((user) => user.active && user.role !== "admin").length}</span> active members
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={onArchive}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Archive current week
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total quantity</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalQuantity}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total amount</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">₹{totalAmount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">Live</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Weekly comment</label>
        <textarea
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          disabled={!isAdmin}
          className="mt-3 min-h-[94px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Add a global comment for this week"
        />
      </div>
    </div>
  );
}
