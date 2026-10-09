"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CalendarCheck2,
  Wallet,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { ForgotPasswordDialog } from "@/components/forgot-password-dialog";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

/** Map Supabase Auth callback errors (?error=...) to Indonesian UI messages. */
function mapAuthError(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "AccessDenied":
      return "Login ditolak. Akun belum terdaftar di DailyKu atau sedang nonaktif. Hubungi admin.";
    case "Inactive":
      return "Akun kamu sedang nonaktif. Hubungi admin untuk mengaktifkan kembali.";
    case "AuthError":
      return "Login gagal. Silakan coba lagi.";
    default:
      return "Login gagal. Silakan coba lagi.";
  }
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const errCode = new URLSearchParams(window.location.search).get("error");
    return mapAuthError(errCode);
  });
  const [forgotOpen, setForgotOpen] = useState(false);

  // Clean the ?error= param from the URL so it doesn't persist on refresh.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("error")) {
      params.delete("error");
      const next = params.toString();
      window.history.replaceState({}, "", next ? `/?${next}` : "/");
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return setError("Email harus diisi");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Format email tidak valid");
    if (!password) return setError("Password harus diisi");

    setLoading(true);
    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (signInError) {
      // Map network/config errors to a clear message.
      const msg = signInError.message || "";
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("fetch")
      ) {
        setError(
          isSupabaseConfigured
            ? "Tidak dapat terhubung ke server autentikasi. Periksa koneksi internet kamu."
            : "Supabase belum dikonfigurasi. Hubungi admin untuk mengatur NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
        );
        return;
      }
      setError(msg || "Email atau password salah");
      return;
    }
    router.refresh();
    router.replace("/");
  }

  async function onGoogle() {
    setError(null);
    if (!isSupabaseConfigured) {
      setError(
        "Supabase belum dikonfigurasi. Hubungi admin untuk mengatur NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
      );
      return;
    }
    setGoogleLoading(true);
    const redirectTo =
      window.location.origin + "/api/auth/callback";
    const { error: oauthError } = await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) {
      const msg = oauthError.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("fetch")) {
        setError("Tidak dapat terhubung ke server Google. Periksa koneksi internet kamu.");
      } else {
        setError(msg || "Login Google gagal");
      }
      setGoogleLoading(false);
    }
    // On success the browser is redirected to Google → back to /api/auth/callback.
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-background p-4 dark:from-emerald-950/30">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <CalendarCheck2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">DailyKu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tugas &amp; Keuangan Pribadi dalam satu aplikasi
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarCheck2 className="h-3.5 w-3.5" /> Tugas
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" /> Keuangan
            </span>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || googleLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || googleLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                disabled={loading || googleLoading}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {!isSupabaseConfigured && !error && (
            <div
              role="status"
              className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300"
            >
              Supabase belum dikonfigurasi. Set
              <code className="mx-1 rounded bg-amber-100 px-1 dark:bg-amber-900/60">
                NEXT_PUBLIC_SUPABASE_URL
              </code>
              dan
              <code className="mx-1 rounded bg-amber-100 px-1 dark:bg-amber-900/60">
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </code>
              di <code>.env</code> / Vercel untuk mengaktifkan login.
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || googleLoading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Memproses..." : "Login"}
          </Button>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs uppercase tracking-wide text-muted-foreground">
                Atau
              </span>
            </div>
          </div>

          {/* Continue with Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGoogle}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            {googleLoading ? "Menghubungkan..." : "Continue with Google"}
          </Button>

          {/* Forgot password */}
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
              onClick={() => setForgotOpen(true)}
              disabled={loading || googleLoading}
            >
              <KeyRound className="mr-1 h-3 w-3" />
              Lupa Password?
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Belum punya akun? Hubungi admin untuk dibuatkan akun.
        </p>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  );
}

/** Inline Google "G" logo (no external dependency). */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
