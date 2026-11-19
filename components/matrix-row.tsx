"use client";

import Image from "next/image";

import type { AppUser, WeeklyRow } from "@/components/types";

type Props = {
  row: WeeklyRow;
  users: AppUser[];
  currentUser: AppUser | null;
  isAdmin: boolean;
  onRowChange: (rowId: string, field: "totalQuantity" | "totalAmount" | "rowNote", value: number | string) => void;
  onEntryChange: (rowId: string, userId: string, field: "quantity" | "cost", value: number) => void;
};

export function MatrixRow({ row, users, currentUser, isAdmin, onRowChange, onEntryChange }: Props) {
  const canEditRow = isAdmin;
  const shortName = row.name.length > 5 ? `${row.name.slice(0, 5)}…` : row.name;
  const totalRequested = users.reduce((sum, user) => sum + (row.entries[user.id]?.quantity ?? 0), 0);

  return (
    <tr className="border-b border-slate-200 align-top text-[10px] text-slate-700">
      <td className="sticky left-0 z-10 border-r border-slate-200 bg-white p-1">
        <div className="flex flex-col items-center gap-1">
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md">
            <Image src={row.smallImage} alt={row.name} fill className="object-cover" />
          </div>
          <div className="max-w-[40px] truncate text-center text-[7px] font-semibold text-slate-900" title={row.name}>
            {shortName}
          </div>
        </div>
      </td>

      <td className="sticky left-[52px] z-10 w-[132px] border-r border-slate-200 bg-slate-50 p-1.5">
        <div className="space-y-1.5">
          <div className="rounded-md bg-white px-1.5 py-1 text-[7px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            Req {totalRequested}
          </div>
          <label className="sr-only" htmlFor={`${row.id}-actual-qty`}>Actual quantity</label>
          <input
            id={`${row.id}-actual-qty`}
            type="number"
            min={0}
            value={row.totalQuantity}
            onChange={(event) => canEditRow && onRowChange(row.id, "totalQuantity", Number(event.target.value || 0))}
            disabled={!canEditRow}
            aria-label="Actual quantity"
            className="w-full rounded-md border border-slate-200 bg-white px-1 py-1 text-[10px] outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <label className="sr-only" htmlFor={`${row.id}-actual-price`}>Actual price</label>
          <input
            id={`${row.id}-actual-price`}
            type="number"
            min={0}
            step="0.01"
            value={row.totalAmount}
            onChange={(event) => canEditRow && onRowChange(row.id, "totalAmount", Number(event.target.value || 0))}
            disabled={!canEditRow}
            aria-label="Actual price"
            className="w-full rounded-md border border-slate-200 bg-white px-1 py-1 text-[10px] outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>
      </td>

      {users
        .filter((user) => user.active && user.role !== "admin")
        .map((user) => {
          const canEditCell = isAdmin || currentUser?.id === user.id;
          const entry = row.entries[user.id] ?? { quantity: 0, cost: 0 };
          const shareLabel = `₹${entry.cost.toFixed(2)}`;

          return (
            <td key={user.id} className="w-[92px] border-r border-slate-200 p-1.5">
              <div className="space-y-1.5">
                <label className="sr-only" htmlFor={`${row.id}-${user.id}-qty`}>
                  Quantity for {user.name}
                </label>
                <input
                  id={`${row.id}-${user.id}-qty`}
                  type="number"
                  min={0}
                  value={entry.quantity}
                  onChange={(event) =>
                    canEditCell && onEntryChange(row.id, user.id, "quantity", Number(event.target.value || 0))
                  }
                  disabled={!canEditCell}
                  aria-label={`Quantity for ${user.name}`}
                  className="w-full rounded-md border border-slate-200 bg-white px-1 py-1 text-[10px] outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <div className="rounded-md border border-slate-200 bg-slate-50 px-1 py-1 text-[8px] font-medium text-slate-700">
                  {shareLabel}
                </div>
              </div>
            </td>
          );
        })}

      <td className="w-[96px] p-1.5">
        {canEditRow ? (
          <textarea
            value={row.rowNote}
            onChange={(event) => onRowChange(row.id, "rowNote", event.target.value)}
            className="min-h-[52px] w-full rounded-md border border-slate-200 bg-white px-1 py-1 text-[9px] outline-none transition focus:border-emerald-500"
            placeholder="Note"
          />
        ) : (
          <div className="rounded-md bg-slate-100 px-1 py-1 text-[8px] text-slate-600">{row.rowNote || "-"}</div>
        )}
      </td>
    </tr>
  );
}
