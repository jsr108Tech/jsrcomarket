"use client";

import type { WeeklyRow, WeeklySnapshot } from "@/components/types";

type Props = {
  rows: WeeklyRow[];
  label: string;
  archive?: WeeklySnapshot | null;
};

const toCsvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export function ExportToolbar({ rows, label, archive }: Props) {
  const exportCsv = () => {
    const headers = ["Item", "Qty", "Amount", "Row note"];
    const rowsCsv = rows.map((row) => {
      const cells = [row.name, row.totalQuantity, row.totalAmount, row.rowNote];
      return cells.map(toCsvValue).join(",");
    });

    const csv = [headers.map(toCsvValue).join(","), ...rowsCsv].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      return;
    }

    const content = rows
      .map(
        (row) => `
          <tr>
            <td>${row.name}</td>
            <td>${row.totalQuantity}</td>
            <td>₹${row.totalAmount}</td>
            <td>${row.rowNote || "-"}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${label}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 0.6rem; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>${archive ? archive.weekLabel : label}</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Row note</th>
              </tr>
            </thead>
            <tbody>${content}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={exportCsv}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={exportPdf}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Export PDF
      </button>
    </div>
  );
}
