"use client";

import { useState } from "react";
import { Loader2, Mail, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * "Lupa Password" dialog. Uses Supabase Auth `resetPasswordForEmail` to send a
 * recovery email. Supabase handles the token + email delivery; we never store
 * or send passwords ourselves.
 *
 * The recovery link redirects to /api/auth/callback?next=/?reset=1, which
 * exchanges the code for a recovery session and sends the user to /?reset=1 —
 * where ResetPasswordForm is shown.
 *
 * For security, we always show a generic success message (Supabase does not
 * reveal whether the email is registered).
 */
export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setEmail("");
    setLoading(false);
    setDone(false);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) return setError("Email harus diisi");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return setError("Format email tidak valid");

    setLoading(true);
    const redirectTo =
      window.location.origin +
      "/api/auth/callback?next=" +
      encodeURIComponent("/?reset=1");

    const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(
      trimmed.toLowerCase(),
      { redirectTo }
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message || "Gagal mengirim link reset");
      return;
    }
    setDone(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {!done ? (
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Reset Password
              </DialogTitle>
              <DialogDescription>
                Masukkan email akun kamu. Kami akan mengirim link untuk membuat
                password baru.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="pl-9"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Link Reset Terkirim
              </DialogTitle>
              <DialogDescription>
                Jika email <strong>{email.trim()}</strong> terdaftar, link
                reset password telah dikirim. Periksa kotak masuk email kamu
                (termasuk folder spam).
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Kembali ke Login
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
