"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { BASE_CATALOG } from "@/components/catalog";
import type { CatalogItem } from "@/components/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onAddItem: (item: CatalogItem) => void;
};

export function ItemCatalogModal({ open, onClose, onAddItem }: Props) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return BASE_CATALOG;
    }

    return BASE_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term),
    );
  }, [query]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Item catalog</h2>
            <p className="text-sm text-slate-500">Search and add grocery items to the active weekly list.</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-5">
          <label className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-lg">🔎</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search items..."
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                  <Image src={item.smallImage} alt={item.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs uppercase tracking-[0.20em] text-emerald-600">
                        {item.quantityType}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                      onClick={() => {
                        onAddItem(item);
                        onClose();
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
