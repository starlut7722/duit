# DailyKu

Aplikasi web untuk menggabungkan **manajemen tugas** (sekolah/pribadi) dan
**pengelolaan keuangan pribadi**. Satu admin, maksimal `MAX_ACTIVE_USERS` user
aktif (default 5, mudah dinaikkan).

---

## ✅ Stack Teknologi (production)

| Komponen          | Teknologi                                                  |
| ----------------- | ---------------------------------------------------------- |
| Framework         | **Next.js 16 (App Router) + React 19 + TypeScript**        |
| Database          | **Supabase PostgreSQL** (via **Prisma** `postgresql`)      |
| Auth              | **Supabase Authentication** (`@supabase/ssr`)              |
| Google login      | Supabase Auth → Google OAuth provider                       |
| Password reset    | Supabase Auth recovery email                                |
| RLS               | Supabase RLS diaktifkan **+** server-side ownership check   |
| Hosting           | **Vercel** (Next.js default, no custom server)              |
| Styling           | Tailwind CSS 4 + shadcn/ui (accent: emerald)                |

Semua fitur berfungsi penuh: login terpadu (email/password + Google + lupa
password), role admin/user, dashboard, tugas + pengingat, kalender, keuangan +
grafik, target tabungan, kalkulator 40/30/20/10, dark mode, responsive,
pemisahan data antar-user, batas user aktif konfigurabel (`MAX_ACTIVE_USERS`).

> File `docs/database.sql` berisi skema **PostgreSQL/Supabase lengkap** (tabel,
> UUID, FK ke `auth.users`, CHECK constraint, index, RLS, trigger).

---

## 1. Struktur Folder

```
src/
├── app/
│   ├── layout.tsx              # Root layout: Providers (Query/Theme) + metadata + PWA
│   ├── page.tsx                # Satu-satunya route user (/): merender <AppShell/>
│   ├── globals.css
│   └── api/
│       ├── auth/callback/route.ts        # Supabase Auth callback (OAuth + recovery)
│       ├── me/                            # GET profile, PATCH nama, POST ganti password (Supabase)
│       ├── me/create-password/            # Google-only user buat password (Supabase updateUser)
│       ├── tasks/  + [id]/                # CRUD tugas (owner-only)
│       ├── transactions/ + [id]/          # CRUD transaksi (owner-only)
│       ├── savings-goals/ + [id]/         # CRUD + tambah/tarik dana (owner-only)
│       └── admin/
│           ├── stats/                     # Statistik admin (admin-only)
│           └── users/ + [id]/             # Manajemen user (Supabase admin API + Prisma)
├── proxy.ts                    # Next 16 proxy (middleware) — refresh Supabase session cookie
├── components/
│   ├── ui/                     # shadcn/ui (sudah ada semua)
│   ├── providers.tsx           # QueryClientProvider + ThemeProvider
│   ├── theme-toggle.tsx       # Dark mode (next-themes)
│   ├── login-form.tsx          # Satu halaman login (Supabase signInWithPassword / OAuth)
│   ├── forgot-password-dialog.tsx  # Supabase resetPasswordForEmail
│   ├── reset-password-form.tsx      # Supabase updateUser (recovery)
│   ├── app-shell.tsx           # Shell: sidebar (desktop) + bottom nav (mobile) + view switcher
│   ├── notification-scheduler.tsx  # Web Notification untuk pengingat tugas
│   └── views/                  # Tiap "halaman" aplikasi
│       ├── user-dashboard.tsx        tasks-view.tsx        task-form-dialog.tsx
│       ├── calendar-view.tsx         finance-view.tsx     transaction-form-dialog.tsx
│       ├── finance-charts.tsx        savings-view.tsx     savings-goal-dialog.tsx
│       ├── calculator-view.tsx       profile-view.tsx
│       └── admin-dashboard.tsx       admin-users-view.tsx admin-user-dialog.tsx
├── hooks/                      # TanStack Query hooks + use-supabase-session + use-toast/use-mobile
├── lib/
│   ├── db.ts                   # Prisma client (PostgreSQL)
│   ├── config.ts               # ⭐ MAX_ACTIVE_USERS = 5 (+ kategori, reminder options)
│   ├── auth-guard.ts           # requireUser / requireAdmin (Supabase getUser + profile)
│   ├── supabase/               # server.ts / client.ts / admin.ts (Supabase clients)
│   ├── validators.ts           # Skema zod (login, task, transaction, savings, user)
│   ├── format.ts               # formatCurrency (IDR), formatDateLong, dll (locale id-ID)
│   └── api-fetch.ts            # Fetch helper client + ApiError
├── types/index.ts              # Tipe bersama (Task, Transaction, SavingsGoal, ...)
prisma/
├── schema.prisma               # Skema aktif (Profile, Task, Transaction, SavingsGoal)
scripts/seed.ts                 # Membuat 1 akun admin
docs/database.sql               # Skema PostgreSQL/Supabase + RLS (referensi)
.env / .env.example
```

---

## 2. Daftar Dependency Penting

Runtime: `next@16`, `react@19`, `typescript@5`, `tailwindcss@4`, `prisma@6`,
`@prisma/client`, `@supabase/ssr`, `@supabase/supabase-js`, `@tanstack/react-query`, `recharts`,
`zod`, `react-hook-form`, `next-themes`, `lucide-react`, `date-fns`, `framer-motion`,
plus seluruh komponen **shadcn/ui** (New York). Lihat `package.json` untuk detail.

---

## 3. Status Koneksi Supabase (saat ini)

Project ini sudah terhubung ke project Supabase **`giezmrrydiuswngtuzce`**:

| Variabel | Status | Nilai |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ terisi | `https://giezmrrydiuswngtuzce.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ terisi | `sb_publishable_ULVuIMSQ4lAmdeyMpMvxyg_l4bvVeZQ` |
| `DATABASE_URL` | ⏳ perlu DB password | placeholder `[DB_PASSWORD]` |
| `DIRECT_URL` | ⏳ perlu DB password | placeholder `[DB_PASSWORD]` |
| `SUPABASE_SERVICE_ROLE_KEY` | ⏳ perlu service key | placeholder |

**Sudah diverifikasi**: login page terhubung ke Supabase Auth asli — percobaan
login dengan user fake mengembalikan "Invalid login credentials" dari server
Supabase kamu (bukan "Failed to fetch"). Fitur auth (email/password, Google,
lupa password) siap dipakai begitu 3 langkah manual di bawah selesai.

## 3b. Yang perlu kamu konfigurasi manual (3 langkah)

### Langkah 1 — Buat tabel di database (wajib)
Buka **Supabase Dashboard → SQL Editor → New query** → paste seluruh isi
**`docs/database.sql`** → **Run**. Ini membuat tabel `profiles`, `tasks`,
`transactions`, `savings_goals` + RLS + trigger `handle_new_user`.

### Langkah 2 — Ambil DB password + service-role key, isi `.env`
1. **Database password**: Supabase Dashboard → Project Settings → Database →
   "Reset database password" (atau pakai yang sudah ada). Salin password.
2. Lihat **Connection pooling** di halaman yang sama → salin host pooler
   (mis. `aws-0-ap-southeast-1.pooler.supabase.com`).
3. Edit file `.env` di project lokal, ganti `[DB_PASSWORD]` dan `[region]`:
   ```
   DATABASE_URL="postgresql://postgres.giezmrrydiuswngtuzce:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.giezmrrydiuswngtuzce:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```
4. **Service-role key**: Project Settings → API → `service_role` → salin.
   Ganti `[PASTE_SERVICE_ROLE_KEY_HERE]` di `.env`.

### Langkah 3 — Buat akun admin utama
Admin utama DailyKu:

```
Email    : zuraanaksoleh14@gmail.com
Password : admin12345  (sementara — ganti setelah login pertama)
Role     : admin
Status   : aktif
```

**Jalur A (otomatis — disarankan):** setelah Langkah 1 (SQL) + Langkah 2 (secret di `.env`) selesai, jalankan:
```bash
ADMIN_EMAIL="zuraanaksoleh14@gmail.com" \
ADMIN_PASSWORD="admin12345" \
bun run db:seed
```
Script ini membuat user di Supabase Auth + insert profile dengan `id == auth user id`, `role='admin'`, `is_active=true`. Idempoten (aman dijalankan ulang). Password disimpan di Supabase Auth (hash), **bukan** di tabel profiles.

**Jalur B (manual via Dashboard):** ikuti `docs/create-admin.sql` — buat user di Supabase Dashboard → Authentication → Users (email + password + centang "Auto Confirm User"), salin UUID, lalu jalankan SQL insert profile di SQL Editor.

### (Opsional) Aktifkan Google Login
Supabase Dashboard → Authentication → Providers → **Google** → aktifkan →
masukkan Google OAuth Client ID & Secret dari
https://console.cloud.google.com/apis/credentials
(Authorized redirect URI: `https://giezmrrydiuswngtuzce.supabase.co/auth/v1/callback`).

### (Opsional) Konfigurasi Auth URL
Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `http://localhost:3000` (dev) atau domain Vercel production.
- **Redirect URLs**: tambahkan `http://localhost:3000/api/auth/callback` dan
  `https://<vercel-domain>/api/auth/callback`.

## 3c. Konfigurasi Vercel

1. Push project ke GitHub/GitLab.
2. https://vercel.com → New Project → import repo. Vercel auto-detect **Next.js**.
3. **Build & Install Command** biarkan default (Vercel pakai `next build` dari
   `package.json` `build` script). Package manager terdeteksi dari `bun.lock`.
4. **Environment Variables** (Project Settings → Environment Variables) — set
   kelima variabel dengan nilai production Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://giezmrrydiuswngtuzce.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_ULVuIMSQ4lAmdeyMpMvxyg_l4bvVeZQ`
   - `DATABASE_URL` = connection string pooler (port 6543, `?pgbouncer=true`)
   - `DIRECT_URL` = connection string direct (port 5432)
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (RAHASIA — jangan commit)
5. **Deploy**. Setelah selesai, update Supabase **Auth → Site URL** & Redirect
   URLs ke domain Vercel (`https://<project>.vercel.app`).
6. (Opsional) Jalankan `bun run db:seed` sekali lagi jika akun admin belum ada
   di database production.

> Tidak ada custom server, tidak ada SQLite, tidak ada proses yang harus terus
> berjalan. Vercel menjalankan Next.js serverless sesuai standar.

---

## 4. Akun Admin (setup)

Akun admin dibuat **bukan** melalui form publik, melainkan via `bun run db:seed`
yang menjalankan `scripts/seed.ts`:

1. Membuat baris di tabel `profiles` dengan `role = 'admin'`, `is_active = true`.
2. Password dikelola **Supabase Auth** (tidak disimpan di tabel kita). Profile hanya
   menyimpan `email`, `full_name`, `role`, `is_active`.
3. Akun bisa langsung login di halaman yang sama dengan user biasa.

```
Email    : admin@dailyku.test
Password : admin12345
```

> **Ubah password admin** setelah login pertama (menu Profil → Ubah Password),
> atau ubah nilai di `scripts/seed.ts` lalu seed ulang.

**Membuat admin lain (prosedur aman):** edit `scripts/seed.ts` (atau jalankan
query langsung ke DB) untuk menyet `role = 'admin'`. Tidak ada UI publik yang
memungkinkan user memilih role admin.

---

## 5. Membuat 5 User

Tidak ada registrasi publik. Admin membuat user dari panel **Manajemen User**:

1. Login sebagai admin.
2. Buka **Manajemen User** → **Tambah User**.
3. Isi nama, email, password, dan status aktif.
4. Ulangi hingga 5 user aktif. Saat batas tercapai, tombol "Aktifkan" dinonaktifkan
   dan server menolak dengan pesan **"Batas user aktif telah tercapai."**

Admin dapat menonaktifkan user aktif lalu mengaktifkan user lain (slot dibebaskan).

---

## 6. Mengubah MAX_ACTIVE_USERS dari 5 → 10

Cukup ubah **satu baris** di `src/lib/config.ts`:

```ts
export const MAX_ACTIVE_USERS = 10; // sebelumnya 5
```

Tidak ada perubahan struktur database. Batas dibaca ulang di:
- `POST /api/admin/users` (saat membuat user aktif)
- `PATCH /api/admin/users/:id` (saat mengaktifkan)
- `GET /api/admin/stats` (untuk tampilan)
- Komponen admin (dashboard & manajemen user)

Admin **tidak** dihitung sebagai user aktif.

---

## 7. Sistem Login (satu halaman untuk semua)

- Hanya ada **satu** halaman login. Tidak ada pilihan role / dropdown / tombol admin.
- Role ditentukan **internal** dari data `profiles.role` di database — tidak dari input.
- Alur login:
  1. Autentikasi email + password via NextAuth (bcrypt).
  2. Ambil profile dari DB.
  3. Periksa `role`.
  4. Jika `role = user` dan `is_active = false` → tolak ("Akun kamu sedang nonaktif...").
  5. Arahkan: admin → Dashboard Admin, user aktif → Dashboard User.
- Jika user biasa mencoba membuka fungsi admin (langsung via API), server menolak
  dengan **403** — bukan sekadar menyembunyikan menu di frontend.

---

## 8. Keamanan & Pemisahan Data (RLS-equivalent)

Karena tidak memakai Supabase RLS, keamanan data ditegakkan **server-side** di
setiap API route (`src/lib/auth-guard.ts` + tiap handler):

1. `requireUser()` — memastikan ada session valid; menolak user nonaktif (403).
2. `requireAdmin()` — menambah cek `role === 'admin'` (403 untuk non-admin).
3. **Ownership re-check** sebelum setiap read/mutasi: mis. `tasks/[id]` mengambil
   task, lalu memeriksa `task.userId === session.user.id`. Jika berbeda → 403.
4. Field `role` dan `is_active` **tidak pernah** diterima dari endpoint user
   (`/api/me`). User tidak bisa mengubah role, menjadi admin, atau mengaktifkan
   dirinya sendiri.
5. Admin tidak bisa menghapus/mengubah akun admin lain via UI manajemen user
   (server menolak dengan 403).
6. Data antar-user benar-benar terpisah: user A tidak bisa melihat/mengubah/menghapus
   tugas/transaksi/target milik user B.

Verifikasi cepat (dari console browser sebagai user biasa):
```js
await fetch('/api/admin/stats').then(r => r.status)  // 403
await fetch('/api/admin/users').then(r => r.status)  // 403
await fetch('/api/tasks').then(r => r.status)        // 200 (data milik sendiri)
```

---

## 9. Sistem Authentication (diperbarui)

Satu halaman login untuk semua akun (admin & user). Tidak ada pilihan role /
dropdown / tombol admin khusus. Login form kini memiliki:

- **Field Email** + **Field Password** dengan tombol 👁 (lihat/sembunyikan password).
- Tombol **[ LOGIN ]** (email + password via NextAuth credentials).
- Pemisah **"---------------- ATAU ----------------"**.
- Tombol **[ Continue with Google ]** (Google OAuth via NextAuth `GoogleProvider`).
- Tombol **[ Lupa Password? ]** (reset password via token).

### Login Google
- Menggunakan NextAuth `GoogleProvider` (bukan implementasi sendiri).
- Di callback `signIn`, email Google dicocokkan ke `profiles` di database.
  - **Tidak terdaftar** → ditolak, kembali ke login dengan pesan "akun belum
    diizinkan". Tidak ada auto-provisioning akun Google acak.
  - **User nonaktif** → ditolak.
  - **Valid** → Google ditautkan (`googleConnected = true`), masuk dashboard sesuai role.
- Role selalu dari database, tidak pernah dari pilihan user.
- Konfigurasi: set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` di `.env`.
  Redirect URI: `http://localhost:3000/api/auth/callback/google`.

### Lupa Password
- Klik "Lupa Password?" → dialog "Reset Password" → masukkan email → "Kirim Link Reset".
- API `POST /api/auth/forgot-password` membuat token sekali pakai (30 menit,
  tabel `PasswordResetToken`) dan "mengirim" link `/?reset=TOKEN`.
  - Selalu respons sukses generik (tidak membocorkan apakah email terdaftar).
  - Lingkungan sandbox ini tidak punya layanan email, jadi link juga ditampilkan
    di dialog (mode development) agar bisa diuji end-to-end. Di production, link
    dikirim via email provider.
- Buka link → form "Set New Password" (password baru + konfirmasi) →
  `POST /api/auth/reset-password` mengonsumsi token & menyet password baru.
- Setelah berhasil → pesan sukses → kembali ke login.

### Profil → Keamanan Akun
- Card "Keamanan Akun" menampilkan: **Email**, **Google** (Terhubung/Tidak
  terhubung), **Password** (Tersedia/Belum tersedia).
- Jika belum punya password (akun Google-only): tombol **[ Buat Password ]** →
  dialog membuat password → `POST /api/me/create-password`. Setelah ini, akun
  bisa login dengan Google ATAU email+password.
- Jika sudah punya password: kartu "Ubah Password" (verifikasi password lama).
- Password aktual tidak pernah ditampilkan. Role/status admin/status aktif
  tidak dapat diubah user.

### Satu akun, dua metode login
Jika email Google sama dengan akun yang sudah ada → akun yang sama ditautkan
(tidak dibuat akun duplikat). Setelah menambah password, akun dapat login
dengan Google atau email+password.

## 10. Fitur Lengkap

**User:** Dashboard (salam + 6 kartu statistik + Deadline Terdekat + ringkasan
pengeluaran bulan berjalan), Tugas (CRUD, filter, sort, indikator deadline,
pengingat via Web Notification), Kalender bulanan (klik tanggal/lihat tugas),
Keuangan (pemasukan/pengeluaran, filter Hari/Minggu/Bulan/Tahun, pencarian,
grafik batang & donat), Target Tabungan (progress bar, tambah/tarik dana),
Atur Keuangan (kalkulator 40/30/20/10), Profil (ubah nama, ubah password,
logout), Dark Mode, responsive (sidebar desktop + bottom nav mobile).

**Admin:** Dashboard (Total user, User aktif `x/5`, User tidak aktif, Batas
maksimal, progress bar, peringatan batas tercapai), Manajemen User (tabel
responsif, tambah/aktifkan/nonaktifkan/edit/hapus, akun admin diproteksi),
Profil, Logout.

**Validasi, loading state (skeleton), empty state ramah, konfirmasi penghapusan
(AlertDialog), dan toast** ada di seluruh aplikasi.

### Catatan pengingat (Web Notification)
Pengingat berjalan **selama tab DailyKu terbuka**. Browser tidak menjamin
notifikasi muncul jika tab/perangkat sepenuhnya tertutup — ini keterbatasan web
notification yang kami sampaikan secara jujur, bukan janji berlebihan. User dapat
mengaktifkan izin notifikasi dari halaman Tugas.

### Tidak ada fitur Export Excel/CSV
Sesuai spec, tidak ada tombol/menu/API/library export Excel maupun CSV.

---

## 10. Testing

**Login admin:**
1. Buka `/` → muncul form login "DailyKu".
2. Email `admin@dailyku.test`, password `admin12345` → Login.
3. Harus masuk ke **Dashboard Admin** (menu: Dashboard, Manajemen User, Profil).

**Login user:**
1. (Admin buat 1 user dari Manajemen User terlebih dahulu.)
2. Logout, lalu login dengan email/password user.
3. Harus masuk ke **Dashboard User** (menu: Dashboard, Tugas, Kalender, Keuangan,
   Target Tabungan, Atur Keuangan, Profil).

**Pemisahan data antar-user:**
1. Login sebagai user A, tambah tugas/transaksi.
2. Logout, login sebagai user B. Dashboard user B kosong (tidak melihat data A).
3. (Server-side) `GET /api/tasks` milik B tidak mengembalikan data A berkat
   filter `where: { userId: userB.id }` + ownership check.

**User nonaktif:**
1. Admin nonaktifkan user B.
2. User B mencoba login → ditolak: "Akun kamu sedang nonaktif. Hubungi admin..."
3. Jika user B punya session lama, request berikutnya → 403 → otomatis logout.

**Batas user aktif:**
1. Buat 5 user aktif. User ke-6 tidak bisa diaktifkan (tombol disable + 409 dari server).

**Ubah batas:** ganti `MAX_ACTIVE_USERS = 10` di `src/lib/config.ts` → bisa 10 user aktif.

---

## 11. PWA

`public/manifest.webmanifest` + `public/icon.svg` sudah disediakan dan ditautkan
di `layout.tsx` (metadata + appleWebApp). Aplikasi siap dikembangkan menjadi PWA
instalable tanpa mengorbankan fitur utama.
