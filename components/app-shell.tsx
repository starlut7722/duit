"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  Wallet,
  Target,
  Calculator,
  UserCircle,
  Users,
  LogOut,
  Loader2,
  CalendarCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "@/components/login-form";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { NotificationScheduler } from "@/components/notification-scheduler";
import { useMe } from "@/hooks";
import { ApiError } from "@/lib/api-fetch";
import type { UserView, AdminView } from "@/types";

import { UserDashboard } from "@/components/views/user-dashboard";
import { TasksView } from "@/components/views/tasks-view";
import { CalendarView } from "@/components/views/calendar-view";
import { FinanceView } from "@/components/views/finance-view";
import { SavingsView } from "@/components/views/savings-view";
import { CalculatorView } from "@/components/views/calculator-view";
import { ProfileView } from "@/components/views/profile-view";
import { AdminDashboard } from "@/components/views/admin-dashboard";
import { AdminUsersView } from "@/components/views/admin-users-view";

const USER_NAV: { key: UserView; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "tasks", label: "Tugas", icon: ListTodo },
  { key: "calendar", label: "Kalender", icon: CalendarDays },
  { key: "finance", label: "Keuangan", icon: Wallet },
  { key: "savings", label: "Target Tabungan", icon: Target },
  { key: "calculator", label: "Atur Keuangan", icon: Calculator },
  { key: "profile", label: "Profil", icon: UserCircle },
];

const ADMIN_NAV: { key: AdminView; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "users", label: "Manajemen User", icon: Users },
  { key: "profile", label: "Profil", icon: UserCircle },
];

function usePersistedView(role: "admin" | "user") {
  const storageKey = `dailyku:view:${role}`;
  const [view, setView] = useState<string>(() => {
    if (typeof window === "undefined") return "dashboard";
    return window.localStorage.getItem(storageKey) || "dashboard";
  });
  useEffect(() => {
    window.localStorage.setItem(storageKey, view);
  }, [view, storageKey]);
  return [view, setView] as const;
}

export function AppShell() {
  const { session, status } = useSupabaseSession();
  const meQuery = useMe();

  // Both view states are created unconditionally to satisfy the rules of hooks.
  const adminView = usePersistedView("admin");
  const userView = usePersistedView("user");

  // If the profile fetch fails with 403 (account deactivated server-side),
  // force sign-out so the login screen shows again.
  useEffect(() => {
    if (meQuery.error instanceof ApiError && meQuery.error.status === 403) {
      supabaseBrowser.auth.signOut();
    }
  }, [meQuery.error]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    // Password-reset flow: Supabase recovery redirect lands on /?reset=1 with
    // an active recovery session. Show the "Set New Password" view instead of
    // the login form (single-route constraint preserved).
    if (typeof window !== "undefined") {
      const isReset = new URLSearchParams(window.location.search).has("reset");
      if (isReset) {
        return <ResetPasswordForm />;
      }
    }
    return <LoginForm />;
  }

  // role/fullName come from our profile (via /api/me), not the Supabase user.
  // While /api/me loads, fall back to a neutral name.
  const role = (meQuery.data?.role ?? "user") as "admin" | "user";
  const fullName = meQuery.data?.fullName ?? session.user?.email ?? "Pengguna";
  const email = session.user?.email ?? "";

  return role === "admin" ? (
    <Shell
      nav={ADMIN_NAV}
      viewKey={adminView}
      fullName={fullName}
      email={email}
      roleLabel="Admin"
    >
      {(view) =>
        view === "dashboard" ? (
          <AdminDashboard onNavigate={(v) => adminView[1](v)} />
        ) : view === "users" ? (
          <AdminUsersView />
        ) : (
          <ProfileView />
        )
      }
    </Shell>
  ) : (
    <>
      <Shell
        nav={USER_NAV}
        viewKey={userView}
        fullName={fullName}
        email={email}
        roleLabel="User"
      >
        {(view) =>
          view === "dashboard" ? (
            <UserDashboard onNavigate={(v) => userView[1](v)} />
          ) : view === "tasks" ? (
            <TasksView />
          ) : view === "calendar" ? (
            <CalendarView />
          ) : view === "finance" ? (
            <FinanceView />
          ) : view === "savings" ? (
            <SavingsView />
          ) : view === "calculator" ? (
            <CalculatorView />
          ) : (
            <ProfileView />
          )
        }
      </Shell>
      <NotificationScheduler />
    </>
  );
}

type AnyNav = { key: string; label: string; icon: React.ElementType };

function Shell({
  nav,
  viewKey,
  fullName,
  email,
  roleLabel,
  children,
}: {
  nav: AnyNav[];
  viewKey: readonly [string, (v: string) => void];
  fullName: string;
  email: string;
  roleLabel: string;
  children: (view: string) => React.ReactNode;
}) {
  const [view, setView] = viewKey;
  const current = nav.find((n) => n.key === view) ? view : nav[0].key;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">DailyKu</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = current === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-500 text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="border-t p-3">
            <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => supabaseBrowser.auth.signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar (mobile shows logo + actions; desktop shows page title + actions) */}
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="flex h-14 items-center gap-2 px-4 md:px-6">
              <div className="flex items-center gap-2 md:hidden">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-white">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">DailyKu</span>
              </div>
              <h1 className="hidden text-base font-semibold md:block">
                {nav.find((n) => n.key === current)?.label}
              </h1>
              <div className="ml-auto flex items-center gap-1">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Logout"
                  onClick={() => supabaseBrowser.auth.signOut()}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
            <div className="mx-auto w-full max-w-6xl">{children(current)}</div>
          </main>

          {/* Desktop footer (sticky to bottom) */}
          <footer className="mt-auto hidden border-t bg-card px-6 py-3 text-center text-xs text-muted-foreground md:block">
            DailyKu &copy; {new Date().getFullYear()} — Tugas &amp; Keuangan Pribadi
          </footer>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex overflow-x-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`flex min-w-[64px] flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
