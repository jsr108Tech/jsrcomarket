"use client";

import type { WeeklySnapshot } from "@/components/types";

type Props = {
  archives: WeeklySnapshot[];
  selectedArchiveId: string | null;
  onSelectArchive: (archive: WeeklySnapshot) => void;
};

const formatArchiveDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));

export function ArchiveListView({ archives, selectedArchiveId, onSelectArchive }: Props) {
  if (!archives.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        No archived weeks yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Archived weekly reports</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Read-only</span>
      </div>

      {archives.map((archive) => (
        <button
          key={archive.id}
          type="button"
          onClick={() => onSelectArchive(archive)}
          className={`w-full rounded-xl border p-3 text-left transition ${
            selectedArchiveId === archive.id
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-900">{archive.weekLabel}</span>
            <span className="text-xs text-slate-500">{formatArchiveDate(archive.archivedAt)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{archive.comment || "No comment on archive"}</p>
        </button>
      ))}
    </div>
  );
}
