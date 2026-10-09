"use client";

import dynamic from "next/dynamic";

// The entire app lives behind auth, so render it client-side only to avoid
// SSR/hydration friction with next-themes and the Supabase browser session.
const AppShell = dynamic(
  () => import("@/components/app-shell").then((m) => m.AppShell),
  { ssr: false, loading: () => null }
);

export default function Home() {
  return <AppShell />;
}
