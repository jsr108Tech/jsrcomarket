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
  const activeUsers = users.filter((user) => user.active);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] table-fixed border-collapse">
          <thead className="bg-slate-100 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            <tr>
              <th className="sticky left-0 z-20 w-[72px] border-r border-slate-200 bg-slate-100 px-1.5 py-3">Item</th>
              <th className="sticky z-10 w-[100px] border-r border-slate-200 bg-slate-100 px-1.5 py-3" style={{ left: 72 }}>
                Total
              </th>
              {activeUsers.map((user) => (
                <th key={user.id} className="min-w-[130px] border-r border-slate-200 px-2 py-3">
                  <div>
                    <div>{user.name}</div>
                    <div className="mt-1 text-[9px] tracking-[0.18em] text-slate-500">Qty / Amt</div>
                  </div>
                </th>
              ))}
              <th className="min-w-[140px] px-2 py-3">Row note</th>
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
        </table>
      </div>
    </div>
  );
}
