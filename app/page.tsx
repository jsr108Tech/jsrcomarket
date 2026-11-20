"use client";

import dynamic from "next/dynamic";

import { AuthProvider } from "@/components/providers/auth-provider";

const GroceryApp = dynamic(() => import("@/components/grocery-app"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
      Loading app...
    </div>
  ),
});

export default function Home() {
  return (
    <AuthProvider>
      <GroceryApp />
    </AuthProvider>
  );
}
