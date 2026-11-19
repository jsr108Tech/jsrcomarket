"use client";

import { MatrixRow } from "@/components/matrix-row";
import type { AppUser, WeeklyRow } from "@/components/types";

type Props = {
  rows: WeeklyRow[];
  users: AppUser[];
  currentUser: AppUser | null;
  isAdmin: boolean;
  onRowChange: (rowId: string, field: "totalQuantity" | "totalAmount" | "rowNote", value: number | string) => void;
  onEntryChange: (rowId: string, userId: string, field: "quantity" | "cost", value: number) => void;
};

export function WeeklyMatrixTable({ rows, users, currentUser, isAdmin, onRowChange, onEntryChange }: Props) {
  const activeUsers = users.filter((user) => user.active && user.role !== "admin");
  const totalRequested = rows.reduce(
    (sum, row) => sum + activeUsers.reduce((rowTotal, user) => rowTotal + (row.entries[user.id]?.quantity ?? 0), 0),
    0,
  );
  const totalActualQty = rows.reduce((sum, row) => sum + Number(row.totalQuantity || 0), 0);
  const totalActualPrice = rows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
  const userTotals = activeUsers.map((user) =>
    rows.reduce((sum, row) => sum + Number(row.entries[user.id]?.cost ?? 0), 0),
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] table-fixed border-collapse">
          <thead className="bg-slate-100 text-left text-[7px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            <tr>
              <th className="sticky left-0 z-20 w-[52px] border-r border-slate-200 bg-slate-100 px-1 py-2">Item</th>
              <th className="sticky left-[52px] z-10 w-[132px] border-r border-slate-200 bg-slate-100 px-1 py-2">Admin</th>
              {activeUsers.map((user) => (
                <th key={user.id} className="w-[92px] border-r border-slate-200 px-1 py-2">
                  <div className="leading-tight">
                    <div className="truncate">{user.name}</div>
                    <div className="mt-0.5 text-[6px] tracking-[0.12em] text-slate-500">Qty</div>
                  </div>
                </th>
              ))}
              <th className="w-[96px] px-1 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <MatrixRow
                key={row.id}
                row={row}
                users={activeUsers}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onRowChange={onRowChange}
                onEntryChange={onEntryChange}
              />
            ))}
          </tbody>
          <tfoot className="bg-slate-100 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
            <tr>
              <td className="border-t border-slate-200 px-2 py-3 text-slate-900">Total</td>
              <td className="border-t border-slate-200 px-2 py-3 text-slate-900">₹{totalActualPrice.toFixed(2)} / {totalActualQty}</td>
              
              {userTotals.map((amount, index) => (
                <td key={activeUsers[index].id} className="border-t border-slate-200 px-2 py-3 text-slate-900">₹{amount.toFixed(2)}</td>
              ))}
              
              <td className="border-t border-slate-200 px-2 py-3 text-slate-500">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
