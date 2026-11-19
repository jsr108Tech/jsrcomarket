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

  const totalColumn = (
    <div className="space-y-1 text-center text-[10px] font-medium text-slate-700">
      <div>{row.totalQuantity}</div>
      <div className="text-slate-500">₹{row.totalAmount}</div>
    </div>
  );

  return (
    <tr className="border-b border-slate-200 align-top text-sm text-slate-700">
      <td className="sticky left-0 z-10 border-r border-slate-200 bg-white p-1.5">
        <div className="flex flex-col items-center gap-1">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md">
            <Image src={row.smallImage} alt={row.name} fill className="object-cover" />
          </div>
          <div className="max-w-[42px] truncate text-center text-[9px] font-semibold text-slate-900" title={row.name}>
            {shortName}
          </div>
        </div>
      </td>

      <td className="sticky z-10 border-r border-slate-200 bg-white p-1.5" style={{ left: 72 }}>
        {canEditRow ? (
          <div className="space-y-1">
            <input
              type="number"
              min={0}
              value={row.totalQuantity}
              onChange={(event) => onRowChange(row.id, "totalQuantity", Number(event.target.value || 0))}
              className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1.5 text-[11px] outline-none transition focus:border-emerald-500"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={row.totalAmount}
              onChange={(event) => onRowChange(row.id, "totalAmount", Number(event.target.value || 0))}
              className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1.5 text-[11px] outline-none transition focus:border-emerald-500"
            />
          </div>
        ) : (
          totalColumn
        )}
      </td>

      {users
        .filter((user) => user.active)
        .map((user) => {
          const canEditCell = isAdmin || currentUser?.id === user.id;
          const entry = row.entries[user.id] ?? { quantity: 0, cost: 0 };

          return (
            <td key={user.id} className="min-w-[160px] border-r border-slate-200 p-2">
              <div className="space-y-2">
                <input
                  type="number"
                  min={0}
                  value={entry.quantity}
                  onChange={(event) =>
                    canEditCell && onEntryChange(row.id, user.id, "quantity", Number(event.target.value || 0))
                  }
                  disabled={!canEditCell}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={entry.cost}
                  onChange={(event) =>
                    canEditCell && onEntryChange(row.id, user.id, "cost", Number(event.target.value || 0))
                  }
                  disabled={!canEditCell}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </td>
          );
        })}

      <td className="min-w-[170px] p-2">
        {canEditRow ? (
          <textarea
            value={row.rowNote}
            onChange={(event) => onRowChange(row.id, "rowNote", event.target.value)}
            className="min-h-[76px] w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition focus:border-emerald-500"
            placeholder="Row note"
          />
        ) : (
          <div className="rounded-lg bg-slate-100 px-2 py-2 text-slate-600">{row.rowNote || "No row note"}</div>
        )}
      </td>
    </tr>
  );
}
