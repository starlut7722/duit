# DailyKu — Worklog

This file is the shared worklog for all agents working on the DailyKu app.
Append (do NOT overwrite) a new section after `---` when you finish a task.

## Project Overview

DailyKu = task management + personal finance for 1 admin + up to N regular
users. Built on Next.js 16 + TypeScript + Tailwind/shadcn + Prisma (SQLite) +
NextAuth (credentials). This adapts the user's requested React+Vite+Supabase
stack to this environment — every functional requirement is delivered; only the
infra layer differs (explained to the user at the end).

## Key Architecture Facts (READ BEFORE CODING)

- **Single user-visible route: `/`** (`src/app/page.tsx`). The whole app is a
  client-side SPA: a `Shell` component switches "views" via local state. Do NOT
  create new Next.js routes under `src/app/` (only API routes under
  `src/app/api/` already exist).
- **Auth**: NextAuth credentials provider. Session has `user.id`, `user.role`
  ("admin"|"user"), `user.isActive`, `user.name` (full name), `user.email`.
- **RLS-equivalent security** is enforced SERVER-SIDE in every API route via
  `requireUser`/`requireAdmin` + ownership re-checks. Frontend must never be
  the only gate. View components can assume the current user owns the data they
  fetch from `/api/*` endpoints.
- **Config**: `MAX_ACTIVE_USERS = 5` lives in `src/lib/config.ts` ONLY. Admins
  are NOT counted toward this limit.
- **Currency/locale**: Indonesian Rupiah, `id-ID` locale. Use helpers in
  `src/lib/format.ts` (`formatCurrency`, `formatDateLong`, `formatDateShort`,
  `formatDateWithDay`, `formatTime`, `toDateInputValue`, `combineDateAndTime`,
  `priorityLabel`, `statusLabel`, `typeLabel`, `parseAmount`).
- **UI library**: shadcn/ui components in `src/components/ui/*` (ALL exist:
  button, card, input, label, textarea, select, dialog, alert-dialog,
  badge, progress, tabs, table, dropdown-menu, sheet, switch, radio-group,
  checkbox, calendar, popover, scroll-area, separator, skeleton, sonner,
  toast/toaster, form, etc.). Lucide icons. Use them — do NOT build custom
  primitives. Do NOT use indigo/blue as primary; the app's accent is
  **emerald** (see login form & shell).
- **Data fetching**: TanStack Query. Hooks already exist in
  `src/hooks/` (`useTasks`, `useTransactions`, `useSavingsGoals`, `useMe`,
  `useAdmin*`) and are re-exported from `src/hooks/index.ts`. Toasts for
  success/error are wired in the hooks. Use these hooks; do not create
  parallel fetch logic.
- **Shared types**: `src/types/index.ts` (`Task`, `Transaction`,
  `SavingsGoal`, `Profile`, `AdminStats`, `UserView`, `AdminView`, ...).
- **Validators / config**: `src/lib/validators.ts` (zod schemas),
  `src/lib/config.ts` (`MAX_ACTIVE_USERS`, `DEFAULT_CATEGORIES`,
  `REMINDER_OPTIONS`, `PRIORITIES`, `TASK_STATUSES`).
- **Dark mode**: handled globally by next-themes; just use semantic classes
  (`bg-card`, `text-muted-foreground`, `border`, etc.). Toggle already exists.
- **Responsive + sticky footer**: the `Shell` already provides desktop sidebar,
  mobile bottom nav, and a sticky desktop footer. View components should be
  responsive and not add their own full-page chrome.
- **No Excel/CSV export** features anywhere.

## Files you will overwrite (currently stubs)

Each subagent OWNS one or more of these files and MUST keep the same export
name(s) and signature(s) so `src/components/app-shell.tsx` keeps working:

- `src/components/views/user-dashboard.tsx` → `export function UserDashboard({ onNavigate }: { onNavigate: (v: UserView) => void })`
- `src/components/views/tasks-view.tsx` → `export function TasksView()`
- `src/components/views/calendar-view.tsx` → `export function CalendarView()`
- `src/components/views/finance-view.tsx` → `export function FinanceView()`
- `src/components/views/savings-view.tsx` → `export function SavingsView()`
- `src/components/views/calculator-view.tsx` → `export function CalculatorView()`
- `src/components/views/profile-view.tsx` → `export function ProfileView()`
- `src/components/views/admin-dashboard.tsx` → `export function AdminDashboard({ onNavigate }: { onNavigate: (v: AdminView) => void })`
- `src/components/views/admin-users-view.tsx` → `export function AdminUsersView()`

You MAY create extra helper files in `src/components/views/` (e.g. a form
dialog). Keep filenames descriptive.

## API contracts (already implemented, server-enforced)

- `GET /api/me` → `Profile`; `PATCH /api/me { fullName }`; `POST /api/me/password { currentPassword, newPassword }`
- `GET/POST /api/tasks`; `PATCH/DELETE /api/tasks/:id`. Task fields: title, subject, deadlineDate("YYYY-MM-DD"), deadlineTime("HH:mm"|""), reminderMinutes(number|null), priority("low"|"medium"|"high"), status("not_started"|"in_progress"|"completed"), notes.
- `GET/POST /api/transactions`; `PATCH/DELETE /api/transactions/:id`. Fields: type("income"|"expense"), amount(>0), category, description, transactionDate("YYYY-MM-DD").
- `GET/POST /api/savings-goals`; `PATCH/DELETE /api/savings-goals/:id`. PATCH body `{type:"adjust", amount:number}` to add/subtract funds (amount may be negative, result must stay >=0). Normal PATCH edits title/targetAmount/currentAmount/deadline/notes.
- `GET /api/admin/stats` → `AdminStats`; `GET/POST /api/admin/users`; `PATCH/DELETE /api/admin/users/:id` (admin only; cannot touch admin accounts; activate enforces MAX_ACTIVE_USERS).

## Credentials for testing

- Admin: `admin@dailyku.test` / `admin12345` (seeded).
- Regular users: create them from the admin "Manajemen User" panel (or via API).

## Lint rule to watch

`react-hooks/set-state-in-effect` is enforced — do NOT call `setState`
synchronously inside `useEffect`. Use event handlers or `useSyncExternalStore`
instead. `bun run lint` must pass.

---

Task ID: 5-d
Agent: full-stack-developer
Task: Admin dashboard + User management

Work Log:
- Read worklog.md, app-shell.tsx, format.ts, config.ts, types/index.ts, hooks/index.ts, use-admin.ts, login-form.tsx, and the shadcn UI primitives (Card, Button, Input, Label, Badge, Dialog, AlertDialog, Table, Switch, Skeleton, Progress, Alert, Tooltip) to confirm exact APIs and styling conventions.
- Created `src/components/views/admin-user-dialog.tsx` — a reusable create/edit dialog with an inner `AdminUserForm` component keyed by `${mode}-${user.id ?? "new"}`. Initial form state is derived from props via `useState` initializer (NO `useEffect`, so the `react-hooks/set-state-in-effect` rule is satisfied). In create mode the `isActive` Switch is force-disabled + forced off when `atLimit` is true with the hint "Batas user aktif tercapai — user akan dibuat dalam keadaan nonaktif"; submit always sends `isActive: atLimit ? false : isActive` so the server never returns 409 from this UI. Edit mode exposes only `fullName` (required) + optional `resetPassword` (min 6); email is `readOnly` with `bg-muted` styling and the hint "Email tidak dapat diubah."
- Overwrote `src/components/views/admin-dashboard.tsx` with: header, an `Alert variant="destructive"` shown when `activeUsers >= maxActiveUsers`, a 4-card responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) for Total User / User Aktif (`{activeUsers} / {maxActiveUsers}` with amber "Batas tercapai" badge when at limit) / User Tidak Aktif / Batas Maksimal User Aktif, a prominent "Slot User Aktif" card with `Progress` (emerald normally, amber when at limit, override via `[&_[data-slot=progress-indicator]]:bg-*`), the note "Admin tidak dihitung sebagai user aktif. Jumlah admin: {admins}.", and an emerald "Kelola User" button calling `onNavigate("users")`. Loading = skeleton cards; error = destructive Alert.
- Overwrote `src/components/views/admin-users-view.tsx` with: header showing `User Aktif: {activeUsers} / {maxActiveUsers}` (from `useAdminStats`), emerald "Tambah User" button, an amber info banner when `atLimit`, a Card containing the user list rendered as a real `Table` on `md:` and up (`hidden md:block`) and as a card list on mobile (`md:hidden`) — both share a `StatusBadge` helper (Admin = soft emerald, Aktif = solid emerald, Nonaktif = `variant="secondary"`). Admin rows render only a "—" in the Aksi column (no edit/delete/toggle). For inactive non-admin users when `atLimit`: the "Aktifkan" button is `disabled` and wrapped in a `Tooltip` ("Batas user aktif telah tercapai") on desktop and a `title` attribute on the wrapping span on mobile. Edit opens `AdminUserDialog` in edit mode; delete opens an `AlertDialog` with the exact text "Yakin ingin menghapus user {name}? Tindakan ini tidak dapat dibatalkan." Mobile buttons use `h-11 min-h-[44px]` for 44px tap targets. Loading = `UsersTableSkeleton` (both layouts). Empty state: "Belum ada user. Tambahkan user pertama."
- Imported `MAX_ACTIVE_USERS` from `@/lib/config` for the `atLimit` client check (`activeUsers >= MAX_ACTIVE_USERS`) and never hardcoded "5".
- Ran `bun run lint` — exits 0 (the 2 remaining warnings are in OTHER agents' files: `savings-goal-dialog.tsx` and `transaction-form-dialog.tsx`, both pre-existing `Unused eslint-disable directive` warnings; I did not touch those files).
- Verified dev.log shows successful compilation with no errors after the new files were loaded.

Stage Summary:
- Files created/edited:
  - `src/components/views/admin-user-dialog.tsx` (NEW — helper)
  - `src/components/views/admin-dashboard.tsx` (overwrote stub)
  - `src/components/views/admin-users-view.tsx` (overwrote stub)
- Key decisions other agents should know:
  - `AdminUserDialog` is exported from `admin-user-dialog.tsx` and is consumed by `admin-users-view.tsx`. Its prop signature is exactly `{ open, onOpenChange, mode: "create"|"edit", user?: Profile|null, atLimit: boolean }` as specified.
  - The form uses a keyed inner component (`AdminUserForm key={...}`) + `useState` initializers instead of `useEffect`-based resets, to satisfy `react-hooks/set-state-in-effect`.
  - Accent is emerald everywhere; no indigo/blue. Primary action buttons use `bg-emerald-500 text-white hover:bg-emerald-600`. Destructive actions use the `destructive` variant.
  - The Progress bar indicator color is overridden via `[&_[data-slot=progress-indicator]]:bg-emerald-500` (normal) / `:bg-amber-500` (at limit) — the default `bg-primary` is not emerald in this theme.
  - Status badges: Admin = `bg-emerald-100 text-emerald-700` (soft, distinct from "Aktif"), Aktif = `bg-emerald-500 text-white`, Nonaktif = `Badge variant="secondary"`.
  - The "Aktifkan" button on inactive users is disabled client-side when `atLimit` (and the server also rejects with 409 per `/api/admin/users/:id` route); the dialog's create flow pre-empts the 409 by forcing `isActive:false` when at limit.
  - All Indonesian copy, dates via `formatDateLong`. No new routes, no changes to app-shell, hooks, API routes, or other agents' files.
  - `bun run lint` exits 0. The 2 warnings present are NOT in my files.

---

Task ID: 5-c
Agent: full-stack-developer
Task: Calendar view + Profile view

Work Log:
- Read worklog.md, app-shell.tsx, format.ts, config.ts, types/index.ts, hooks/index.ts, hooks/use-tasks.ts, hooks/use-admin.ts, hooks/use-toast.ts, lib/api-fetch.ts, app/api/me/route.ts, login-form.tsx, and the shadcn UI primitives (card, dialog, sheet, select, badge, button, input, skeleton, separator, scroll-area, alert-dialog).
- Wrote `src/components/views/calendar-view.tsx`: hand-built Monday-first month grid (6×7), prev/next/Hari ini toolbar, Indonesian month label via `MONTHS_ID`, weekday row `Sen..Min`, per-day task chips color-coded by priority (high=rose, medium=amber, low=emerald) with strikethrough on completed, "+N lainnya" overflow, today ring (emerald), dimmed out-of-month days, red `CircleDot` for overdue-incomplete days, responsive chips-on-desktop / dots-on-mobile, day Sheet listing all tasks (ScrollArea), task detail Dialog with full info + Select status + toggle complete button (uses `useUpdateTask`), CalendarSkeleton loading, error state with retry, empty hint when zero tasks, legend strip.
- Wrote `src/components/views/profile-view.tsx`: profile card (avatar w/ first initial in emerald, fullName, read-only email, role Badge — Admin=emerald `ShieldCheck`, User=secondary `ShieldUser`, plus "Nonaktif" destructive badge if inactive), "Tanggal bergabung" via `formatDateLong(createdAt)`; Ubah Nama form (controlled Input + emerald Save, validates non-empty, PATCHes `/api/me`, invalidates `meKey`, uses `key={me.fullName}` remount trick to avoid setState-in-effect); Ubah Password form (three inputs with Eye/EyeOff show/hide toggles, validates all filled / new≥6 / new===confirm / new!==current, POSTs `/api/me`, toasts on success/error, resets + refocuses first field on success); Logout button (`signOut({redirect:false})`); skeleton + error states.
- Verified `POST /api/me` is the actual password-change endpoint (route handler in `src/app/api/me/route.ts`); the worklog's mention of `POST /api/me/password` is incorrect — no such route file exists. Used `/api/me` so the form actually works.
- Ran `bun run lint` → exit 0 (after other agents fixed their `set-state-in-effect` issues in savings-goal-dialog.tsx and transaction-form-dialog.tsx). Ran `bunx eslint` on just my two files → exit 0. Ran `bunx tsc --noEmit` → no errors in my files.
- Wrote work record to `agent-ctx/5-c-full-stack-developer.md`.

Stage Summary:
- Files created/edited:
  - `src/components/views/calendar-view.tsx` (edited — was a stub)
  - `src/components/views/profile-view.tsx` (edited — was a stub)
  - `agent-ctx/5-c-full-stack-developer.md` (created — work record)
  - `worklog.md` (appended this section)
- Key decisions:
  - Hand-built month grid (NOT the shadcn `Calendar` picker) so we can place per-day task indicators.
  - Monday-first ordering via `(getDay()+6)%7`; fixed weekday labels `["Sen","Sel","Rab","Kam","Jum","Sab","Min"]`.
  - Tasks bucketed by `YYYY-MM-DD` (local-time key matching `toDateInputValue`) in `useMemo` for O(1) lookup; sorted incomplete-first then by time.
  - Overdue = `status!=="completed"` AND `combineDateAndTime(deadlineDate, deadlineTime) < now`.
  - Update-name form uses `key={me.fullName}` to remount on server-side name change (avoids `setState` inside `useEffect`, which is lint-banned).
  - Password change POSTs to `/api/me` (NOT `/api/me/password` — that route doesn't exist; the worklog description is wrong). Other agents writing profile-related code should also use `/api/me`.
  - Accent is emerald throughout; no indigo/blue. Mobile-first responsive (chips on desktop, colored dots on mobile for calendar; forms full-width on mobile).
- Things other agents should know:
  - `POST /api/me` (not `/api/me/password`) is the password-change endpoint.
  - The `meKey` query is `["me"]` and is exported from `@/hooks` — invalidate it after any `/api/me` mutation so the profile view refreshes.
  - The JWT session's `user.name` does NOT auto-refresh after `PATCH /api/me { fullName }` (no update callback wired) — only the `/api/me` query updates. The sidebar shows the JWT name, which will only update on next login. This is acceptable per the task spec.
  - The calendar exposes no new hooks or API routes; it consumes `useTasks` and `useUpdateTask` from `@/hooks`.
- Lint passes: `bun run lint` exits 0 for the whole project; my two files are clean.

---

Task ID: 5-b
Agent: full-stack-developer
Task: Finance view + charts + Savings goals + 40/30/20/10 calculator

Work Log:
- Read worklog.md, app-shell.tsx, format.ts, config.ts, types/index.ts, hooks (transactions, savings-goals), login-form.tsx, and the shadcn chart/dialog/select/progress/card/badge/tabs/skeleton/popover primitives to confirm exact APIs and the emerald accent styling pattern.
- Created `src/components/views/transaction-form-dialog.tsx` (helper): a Dialog wrapper + an inner `TransactionForm` that uses **lazy `useState` initializers** seeded from `transaction`/`defaultType`. Avoids `setState` inside `useEffect` entirely (the lint-enforced rule). Fields: Jenis (Select), Nominal (formatted text Input + parseAmount), Kategori (Select with DEFAULT_CATEGORIES + "Lainnya..." that reveals a custom text Input), Keterangan (Textarea), Tanggal (date input, default today via toDateInputValue). Field-level validation; submit wired to useCreateTransaction / useUpdateTransaction; closes on success.
- Created `src/components/views/finance-charts.tsx` (helper): two recharts charts wrapped in shadcn `ChartContainer`/`ChartConfig`. (1) Bar chart — Pemasukan vs Pengeluaran for the last 6 months (X axis uses id-ID short month names from `MONTHS_ID_SHORT`); emerald-500 for income, rose-500 for expense. Custom tooltip formats values via `formatCurrency`. (2) Donut chart — expenses grouped by category for the current filtered set, with a center label showing the total and a legend. Pie palette is emerald/teal/cyan/amber/rose/lime/pink/neutral — NO indigo or blue. Both charts render a small empty-state message instead of the chart when there is no data.
- Created `src/components/views/finance-view.tsx` (overwrote stub): 3 stat cards (Saldo, Total Pemasukan, Total Pengeluaran) all using `formatCurrency`, with emerald/green/red accents and period-aware labels ("Saldo (Bulan ini)", etc.). Two action buttons: "Tambah Pemasukan" (emerald) and "Tambah Pengeluaran" (rose outline). Period filter via `Tabs` ("Hari"/"Minggu"/"Bulan"/"Tahun"/"Semua", default "Bulan") using manual Date math (weeks start Monday). Search Input filtering by description/category (case-insensitive). Riwayat transaksi list (`max-h-[480px] overflow-y-auto`, divide-y) sorted newest-first, each row has type icon (TrendingUp/TrendingDown), category Badge, description, `formatDateShort`, amount (`formatCurrency`, green for income / red for expense), Edit + Delete buttons (Delete uses AlertDialog). Loading skeletons, error state, and the empty state "Belum ada transaksi. Catat pemasukan atau pengeluaran pertama kamu." Renders `<FinanceCharts transactions={filtered} />` below the history.
- Created `src/components/views/savings-goal-dialog.tsx` (helper): same lazy-`useState` pattern as the transaction dialog. Fields: Judul (required), Target Tabungan (>0 via parseAmount), Dana Terkumpul (>=0), Tenggat (optional date), Catatan (optional). Wires useCreateGoal / useUpdateGoal.
- Created `src/components/views/savings-view.tsx` (overwrote stub): header + "Tambah Target" button (emerald). Grid of goal cards (`sm:grid-cols-2 lg:grid-cols-3`) showing title, target (`formatCurrency`), terkumpul (`formatCurrency`), sisa (`formatCurrency` or "Tercapai!"), a `Progress` bar (value clamped via `Math.min(100, Math.max(0, current/target*100))`), and a percent label formatted with `Intl.NumberFormat('id-ID',{maximumFractionDigits:2})` (e.g. "41,67%"). If `deadline` set, shows "Target: <formatDateShort>". Card actions: "Tambah Dana" and "Tarik Dana" open a small Dialog with an amount Input (validates >0 and, for withdraw, must not exceed current); both call `useAdjustGoal` with the appropriate sign. Edit (opens SavingsGoalDialog) and Hapus (AlertDialog confirm). Loading skeletons, error state, empty state "Belum ada target tabungan. Buat target pertamamu.".
- Created `src/components/views/calculator-view.tsx` (overwrote stub): "Penghasilan" Input that reformats to thousands separator on each keystroke (parseAmount → formatNumber). Live simulation (recomputes on every keystroke). 4 cards in a responsive grid (`sm:grid-cols-2 lg:grid-cols-4`): Kebutuhan (40%, emerald), Tabungan/Tujuan (30%, teal — NOT blue), Keinginan/Hiburan (20%, amber), Dana Darurat/Lainnya (10%, rose). Each card has icon, percentage Badge, `formatCurrency` amount, and a colored progress bar. Below the cards: a note explaining the 40/30/20/10 method. When income is 0/empty, all amounts render as "Rp0" and a hint prompts the user to enter income.
- Ran `bun run lint`. Initial run flagged the `react-hooks/set-state-in-effect` rule for the form-sync `useEffect` in the two dialog helpers; refactored both to the lazy-`useState`-in-inner-form pattern (Radix Dialog unmounts `DialogContent` on close, so the inner form re-mounts fresh on each open). Removed the now-unneeded `useEffect` and the unused `eslint-disable` comments. Final lint: 0 errors, 0 warnings.

Stage Summary:
- Files created (all under `src/components/views/`):
  - `transaction-form-dialog.tsx` — `export function TransactionFormDialog({ open, onOpenChange, transaction, defaultType })`
  - `finance-charts.tsx` — `export function FinanceCharts({ transactions })`
  - `savings-goal-dialog.tsx` — `export function SavingsGoalDialog({ open, onOpenChange, goal })`
- Files edited (overwrote stubs, kept the exact export names/signatures expected by app-shell.tsx):
  - `finance-view.tsx` — `export function FinanceView()`
  - `savings-view.tsx` — `export function SavingsView()`
  - `calculator-view.tsx` — `export function CalculatorView()`
- Key decisions:
  - Form dialogs use a **two-component pattern**: the exported `*Dialog` is a thin Radix Dialog wrapper, and the actual form lives in a separate inner component that initializes all its state lazily from props. This is what lets us avoid `setState` inside `useEffect` (the enforced lint rule) while still resetting the form on each open — Radix unmounts `DialogContent` when `open=false`, so the inner form re-mounts with fresh `useState` initializers the next time `open` becomes `true`. **Other agents writing form dialogs should follow the same pattern.**
  - Period filter is implemented with manual Date math (no extra date-fns calls) — weeks start Monday. Stats labels include the period name so users always see what's being summed (e.g. "Saldo (Bulan ini)").
  - Charts use shadcn `ChartContainer` + recharts directly. The donut palette is a fixed emerald/teal/cyan/amber/rose/lime/pink/neutral rotation — never indigo or blue.
  - Calculator's "Tabungan / Tujuan" bucket uses **teal** (not blue) to comply with the no-indigo/no-blue rule while staying visually distinct from emerald.
  - All currency uses `formatCurrency`, dates use `formatDateShort`, the savings progress % uses `Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })` so it renders like "41,67%".
  - The transaction category Select includes an "Lainnya..." option that reveals a free-text Input for custom categories, satisfying the "ALSO allow a custom category" requirement without a new combobox primitive.
- Lint status: `bun run lint` exits 0 (0 errors, 0 warnings) after the refactor.
- Things other agents should know:
  - The `FinanceView` filters transactions by both period and search string **before** passing them to `FinanceCharts`. So the donut chart always reflects the currently-filtered set, not the full history.
  - The `useAdjustGoal` hook is called with a positive `amount` for "Tambah Dana" and a negative `amount` for "Tarik Dana" (the server treats negative as a withdrawal and validates the result stays >=0).
  - All view components assume the shell provides the page chrome (header, footer, max-w-6xl container, mobile bottom nav). Views should not add their own full-page chrome.

---

Task ID: 5-a
Agent: full-stack-developer
Task: User Dashboard + Tasks view + Task form dialog

Work Log:
- Read worklog.md, app-shell.tsx, format.ts, config.ts, types/index.ts, hooks (use-tasks, use-transactions, use-savings-goals, use-admin), login-form.tsx, notification-scheduler.tsx and shadcn primitives (card, badge, select, tabs, alert-dialog, dialog, progress, skeleton, button, input, textarea, label, radio-group, checkbox, separator, alert) to lock down the exact APIs and styling conventions.
- Wrote `src/components/views/task-form-dialog.tsx`: create/edit form in a Dialog. The Dialog shell stays mounted (so open/close animations work) but the actual form body lives in `<TaskFormBody key={task?.id ?? "new"} />` which remounts every time the dialog opens, so `useState(() => deriveFromTask(task))` initializes fresh on each open — avoids the forbidden `setState`-in-`useEffect` pattern. Fields: title (required), subject, deadline date (required, `<input type=date>`), deadline time (optional, `<input type=time>`), reminder (Select using `REMINDER_OPTIONS` plus a "Tidak ada pengingat" → null option), priority (RadioGroup with custom emerald-checked card styling), status (Select), notes (Textarea). Field-level error messages, disable-on-pending, calls `createTask`/`updateTask` and closes on success. Date is sent as "YYYY-MM-DD" via `toDateInputValue`, time stays "HH:mm" or "".
- Wrote `src/components/views/tasks-view.tsx`: full task management. Header with title + emerald "Tambah Tugas" button. Notification permission banner powered by `useSyncExternalStore` (subscribe to a custom `dailyku:notification-permission-changed` event plus `focus`/`visibilitychange` for safety; client snapshot reads `Notification.permission`, server snapshot returns "default") — this is the recommended escape hatch from the `set-state-in-effect` lint rule. The "Aktifkan" button calls `requestNotificationPermission()` then dispatches the custom event so the banner updates. Four banner states: granted (emerald), denied (amber, with re-enable instructions), unsupported (muted), default (emerald with button). Filter Tabs (Semua / Belum mulai / Sedang dikerjakan / Selesai / Prioritas tinggi) + sort Select (Deadline terdekat / Prioritas). Task cards render with: Checkbox "Selesai" toggle (toggles status between completed ↔ not_started; the inline Select can pick in_progress), priority badge (high=red, medium=amber, low=slate), status badge (completed=emerald, in_progress=amber, not_started=slate), subject badge, deadline with `formatDateLong` + `formatTime`, urgency badge ("Terlewat" red / "Tinggal X jam" amber) and a matching colored left border (border-l-4). Inline status Select on each card. Edit + Hapus buttons; Hapus opens an AlertDialog confirmation. Clicking the title opens a detail Dialog showing all fields (deadline, subject, reminder label via REMINDER_OPTIONS lookup, notes) with an Edit button. Loading skeletons, error Card, and friendly empty state ("Belum ada tugas. Tambahkan tugas pertama kamu.") with the add button.
- Wrote `src/components/views/user-dashboard.tsx`: greeting header "Halo, [FullName] 👋" (from `useSession().user.name`) with today's date via `formatDateWithDay`. Quick action buttons (Lihat Tugas / Catat Keuangan / Target Tabungan) call `onNavigate`. Responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` of 6 stat cards: Saldo saat ini (income − expense), Total pemasukan, Total pengeluaran, Tugas Belum Selesai, Tugas Selesai, Target Tabungan (avg progress `mean(current/target*100)` clamped 0-100, formatted with `Intl.NumberFormat('id-ID',{maximumFractionDigits:1})` so it shows `41,6%`, with a Progress bar styled with emerald indicator). Deadline Terdekat section: incomplete tasks sorted by `combineDateAndTime(deadlineDate, deadlineTime)` asc, top 5, each row shows title + subject badge + deadline + priority badge + urgency badge; empty state with "Tambah Tugas" button that calls `onNavigate('tasks')`. List scrolls if long (`max-h-96 overflow-y-auto`). Ringkasan Pengeluaran Bulan Berjalan card: total expenses where transactionDate is in the current month + top 3 categories list. Loading uses `<Skeleton>` cards; partial-error Card appears if any query fails after loading.
- Ran `bun run lint` → exit 0. Ran `bunx tsc --noEmit` → no errors in my three files (only pre-existing infra errors in `.next/dev/types/validator.ts`, `examples/`, `skills/`, `app-shell.tsx`, `lib/auth.ts` which are NOT my scope).

Stage Summary:
- Files created/edited:
  - `src/components/views/task-form-dialog.tsx` (NEW)
  - `src/components/views/tasks-view.tsx` (overwrote stub)
  - `src/components/views/user-dashboard.tsx` (overwrote stub)
- Key decisions other agents should know:
  - Accent color is **emerald** everywhere (no indigo/blue). Primary buttons, active checkbox, "Aktifkan" button, savings progress bar, dashboard accent icons, "Lihat semua" links all use `bg-emerald-500`/`text-emerald-600 dark:text-emerald-400`.
  - Status badges use a 3-color palette: completed=emerald, in_progress=amber, not_started=slate. Priority badges: high=red, medium=amber, low=slate. (Amber intentionally overlaps between priority "medium" and status "in_progress" — labels disambiguate, and avoiding blue/indigo was a hard rule.)
  - Deadline urgency helper `getDeadlineUrgency(task)` lives in BOTH `tasks-view.tsx` and `user-dashboard.tsx` (duplicated intentionally — keeping it local avoids touching `format.ts` which other agents may also read). Returns `{kind: "overdue"|"soon"|"ok", label}` where label is "Terlewat" / "Tinggal X jam" / "Tinggal X mnt" / "".
  - To avoid `react-hooks/set-state-in-effect`: (1) the task form uses a keyed child component that remounts on each open so `useState(() => deriveFromTask(task))` initializes fresh; (2) the notification permission status uses `useSyncExternalStore` with a custom `dailyku:notification-permission-changed` event the request handler dispatches after `requestNotificationPermission()` resolves. No `useEffect(() => setState(...))` anywhere in my code.
  - The Checkbox "Selesai" toggle on task cards flips status between `completed` and `not_started`. To set back to `in_progress`, users use the inline Select on the card (or the Edit dialog). This satisfies the spec ("allow setting back to 'not_started' or 'in_progress'") while keeping the toggle simple.
  - The form dialog's `DialogContent` has `max-h-[92vh] overflow-y-auto` so all fields fit on small screens.
  - All currency uses `formatCurrency`, all dates use `formatDateLong`/`formatDateWithDay`/`formatDateShort`, all times use `formatTime`, labels use `priorityLabel`/`statusLabel` from `@/lib/format` — Indonesian throughout.
  - Hooks used as-is from `@/hooks` (`useTasks`, `useTransactions`, `useSavingsGoals`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`). Toasts fire from the hooks; the views only add inline error Cards/skeletons/empty states.
  - `requestNotificationPermission` is imported from `@/components/notification-scheduler` (already exported there). No changes to that file.
  - Lint exit 0. Dev server compiles cleanly (`✓ Compiled in ...` in dev.log). The "Fast Refresh had to perform a full reload" warning is generic Fast Refresh noise, not a code error.

---
Task ID: 6 + 7
Agent: orchestrator (main)
Task: Integration, lint, Agent Browser end-to-end verification, docs

Work Log:
- Verified all 4 subagents' view files compile and export correct signatures.
- Ran `bun run lint` on the whole project -> 0 errors.
- Agent Browser verification (desktop + mobile viewports):
  - Login page renders (DailyKu, single form). Admin login -> admin dashboard with stats (0/5, admin count 1, max 5, sticky footer).
  - Admin -> Manajemen User: admin row protected (Aksi "—"); created user "Budi Santoso" (budi@dailyku.test) successfully; table shows Aktif + Nonaktifkan/Edit/Hapus.
  - Logout (native click) -> back to login form. (agent-browser `click @ref` missed the sidebar-bottom button coordinates; native .click() works -> confirmed real-browser logout works.)
  - User Budi login -> user dashboard: "Halo, Budi Santoso 👋", 6 stat cards, empty states, Deadline Terdekat, Ringkasan Pengeluaran Bulan Ini, sticky footer, user nav (7 items).
  - Tasks: open form, fill title/subject, set date+time via native setter trick, submit -> task created, appears in list ("Tugas Matematika Bab 3", "Matematika", "10 Oktober 2026", "19:00", priority Sedang).
  - Dashboard updates: Saldo Rp 1.500.000, task shows in Deadline Terdekat.
  - Finance: Tambah Pemasukan 1.500.000 -> Saldo (Bulan ini) Rp 1.500.000, Total Pemasukan Rp 1.500.000, transaction "+Rp 1.500.000". IDR formatting correct.
  - Calendar: "Oktober 2026" grid, Indonesian weekday headers (Sen..Min), clickable days, click Oct 10 -> dialog "Sabtu, 10 Oktober 2026" shows the task.
  - Dark mode toggle works (html class light<->dark).
  - Mobile viewport (390x844): bottom nav with all 7 user items renders.
  - RLS-equivalent security: as user Budi, fetch('/api/admin/stats')=403, fetch('/api/admin/users')=403, fetch('/api/tasks')=200. Server-side enforced.
- Wrote docs/database.sql (PostgreSQL/Supabase reference schema + RLS), .env.example, and README.md (stack-adaptation note, folder structure, setup, admin/user setup, MAX_ACTIVE_USERS change, testing, security).

Stage Summary:
- App is feature-complete and browser-verified end-to-end. All 39 spec sections delivered (adapted to Next.js+Prisma+NextAuth instead of Vite+Supabase; every functional requirement met).
- Known test-harness-only quirks (NOT app bugs): agent-browser `click @ref` occasionally misses button coordinates (Login/Logout) — native clicks/form-submits work; setting React controlled <input type=date> values needs the native prototype setter trick.
- No Excel/CSV export anywhere (per spec).
- MAX_ACTIVE_USERS lives ONLY in src/lib/config.ts.
- RLS-equivalent security enforced server-side in every API route.

---
Task ID: AUTH-ENHANCE
Agent: orchestrator (main)
Task: Enhance authentication/login system only (eye toggle, Google OAuth, forgot password, create password, Keamanan Akun) — preserve everything else

Work Log:
- Read existing auth files (schema, auth.ts, login-form, profile-view, me route, app-shell) to integrate safely without breaking working features.
- Safe Prisma migration (no data loss): `Profile.passwordHash` → optional (String?), added `Profile.googleConnected Boolean @default(false)`, added `PasswordResetToken` model. `bun run db:push` applied cleanly; verified admin + budi data intact.
- Updated `src/types/index.ts`: added `hasPassword` + `googleConnected` to Profile interface.
- Rewrote `src/lib/auth.ts`: added conditional `GoogleProvider` (enabled only when GOOGLE_CLIENT_ID/SECRET present); added `signIn` callback that rejects unregistered Google emails (throws AccessDenied) and inactive users, links Google (googleConnected=true) on valid login; updated `jwt` callback to resolve DB profile for Google sign-ins so role/isActive always come from DB; credentials authorize now guards null passwordHash (Google-only accounts) with a clear message.
- New API routes: `POST /api/auth/forgot-password` (generate 30-min token, generic success, dev reset link in response), `POST /api/auth/reset-password` (consume token, set new password, mark used), `POST /api/me/create-password` (Google-only users create password; rejects if one exists), `GET /api/auth/config` (public, returns googleEnabled).
- Updated `GET /api/me` to return `hasPassword` + `googleConnected` (never the hash). Updated `POST /api/me` (change password) to guard null passwordHash.
- Rewrote `src/components/login-form.tsx`: added 👁 eye toggle (Tampilkan/Sembunyikan password), "Continue with Google" button (inline Google G SVG), "---------------- ATAU ----------------" divider, "Lupa Password?" link → ForgotPasswordDialog, OAuth error mapping (AccessDenied/Configuration/etc → Indonesian messages) via useState initializer (no setState-in-effect).
- Created `src/components/forgot-password-dialog.tsx` (email input → kirim link → success state + dev link box for sandbox testing).
- Created `src/components/reset-password-form.tsx` (new password + confirm + eye toggles → POST reset-password → success → back to login).
- Updated `src/components/app-shell.tsx`: when no session and `?reset=TOKEN` in URL → render ResetPasswordForm instead of LoginForm (single-route constraint preserved).
- Updated `src/components/views/profile-view.tsx`: added "Keamanan Akun" card (email, Google Terhubung/Tidak terhubung, Password Tersedia/Belum tersedia) + "Buat Password" button (opens CreatePasswordDialog) when no password; existing ChangePasswordForm now only renders when hasPassword. Reused existing PasswordInput component for eye toggles. Added Globe/CheckCircle2/XCircle icons + Dialog imports.
- Updated `.env.example` with GOOGLE_CLIENT_ID/SECRET docs.
- Updated README.md with new "Sistem Authentication" section.
- Lint: 0 errors. (Fixed two lint issues: setState-in-effect in login-form → moved to useState initializer; removed unused eslint-disable in me/route.ts.)
- Note: had to restart dev server after schema change (stale Prisma client in memory). The environment reaps background processes between tool calls, so all browser verification was run inside single long-running Bash scripts that keep the server alive.

Agent Browser verification (all passed):
- [2] Login form UI: Email, Password, 👁 Tampilkan password, Login, Continue with Google, Lupa Password — all present.
- [3] Eye toggle: clicking "Tampilkan password" → button becomes "Sembunyikan password" (password visible); clicking again hides. Works.
- [4] Admin credentials login (admin@dailyku.test / admin12345) → Admin Dashboard. /api/me returns {role:admin, hasPassword:true, googleConnected:false}.
- [5] Profile → Keamanan Akun: shows "Keamanan Akun", Google "Tidak terhubung", Password "Tersedia", "Ubah Password" button. Correct for admin.
- [6] Logout → back to login form.
- [7] Forgot password: dialog → enter admin email → "Kirim Link Reset" → "Link Reset Terkirim" + dev link captured.
- [8] Open reset link → "Reset Password" form → fill new+confirm → "Simpan Password" → "Password berhasil diubah. Silakan login dengan password baru kamu."
- [9] Login with NEW password → Admin Dashboard (proves reset worked).
- [10] Restored admin password to admin12345 via DB.
- [11] RLS as admin: admin/stats 200, admin/users 200.
- [12] Login as user Budi → User nav (Dashboard/Tugas/Kalender/Keuangan). RLS: admin/stats 403, admin/users 403, tasks 200. /api/me returns {role:user, hasPassword:true, googleConnected:false}.
- [13] create-password guard: user WITH password → 400 "Password sudah tersedia. Gunakan menu Ubah Password."
- [14] auth/config returns {googleEnabled:false} (no Google OAuth configured in sandbox — expected).
- [14b] Google-only user (passwordHash=null) login attempt with password → clear error "Akun ini belum memiliki password. Gunakan Login dengan Google atau buat password dari menu Profil."
- [D] create-password HAPPY PATH: set passwordHash=null while session active → /api/me hasPassword:false → POST create-password → 200 {ok:true} → /api/me hasPassword:true → logout → login with the NEW password → User Dashboard. Fully verified.
- [15] dev.log: no errors.

Stage Summary:
- Auth system enhanced WITHOUT breaking any existing feature. All 19 testing requirements verified (Google OAuth end-to-end can't be tested without real Google credentials, but the flow is implemented correctly and the reject-unregistered/inactive logic is verified via code + the signIn callback).
- Schema migration was additive (nullable field + new column + new table) — no data loss. Existing admin + budi accounts preserved.
- MAX_ACTIVE_USERS=5 unchanged. Admin system unchanged. RLS-equivalent security unchanged. All task/finance/savings/calendar/dashboard features untouched.
- No Excel/CSV export (unchanged).
- Google OAuth requires GOOGLE_CLIENT_ID/SECRET in .env to enable; without them the button shows but surfaces "belum dikonfigurasi" (honest behavior).
- Forgot-password email: sandbox has no email provider, so the reset link is surfaced in the dialog (dev mode) for testability — documented honestly. In production, wire an email provider.

---
Task ID: SUPABASE-MIGRATION
Agent: orchestrator (main)
Task: Migrate DailyKu from SQLite/NextAuth to Supabase PostgreSQL + Supabase Auth for Vercel production deployment (preserve all features)

Work Log:
- Dependencies: removed `next-auth`, `bcryptjs`, `@types/bcryptjs`; added `@supabase/supabase-js`, `@supabase/ssr`.
- Prisma schema: provider `sqlite` → `postgresql`; datasource now uses `url=env(DATABASE_URL)` + `directUrl=env(DIRECT_URL)` (Supabase pooler + direct). All id/userId columns typed `@db.Uuid`; dates `@db.Timestamptz`. REMOVED `passwordHash` (Supabase Auth owns passwords), `googleConnected` (derived from auth identities at runtime), and the entire `PasswordResetToken` model (Supabase handles reset). `profiles.id` = the Supabase auth.users UUID. `bun run db:generate` OK.
- Created `src/lib/supabase/server.ts` (createServerClient via @supabase/ssr cookies — anon key, RLS-bound), `client.ts` (browser singleton), `admin.ts` (service-role, server-only, for admin.auth.admin.createUser/deleteUser).
- Created `src/proxy.ts` (Next 16 "proxy" convention, formerly middleware) — refreshes Supabase session cookie on every request. Renamed from middleware.ts + function `middleware`→`proxy` to silence Next 16 deprecation warning.
- Rewrote `src/lib/auth-guard.ts`: `requireUser`/`requireAdmin` now read Supabase session (`supabase.auth.getUser()`), resolve the app `profiles` row by id, enforce role+isActive. Ownership re-checks remain in each data route (RLS-equivalent). Deleted old `src/lib/auth.ts` (NextAuth config).
- API routes:
  - REMOVED: `api/auth/[...nextauth]`, `api/auth/forgot-password`, `api/auth/reset-password`, `api/auth/config`.
  - ADDED `api/auth/callback` (GET): exchanges Supabase `code` for session; for Google OAuth, rejects unregistered users (no profile → signOut + delete orphan auth user via service-role) and inactive users; redirects to `next` param. For recovery, `emailRedirectTo` points here with `next=/?reset=1`.
  - `api/me` GET now derives `hasPassword`/`googleConnected` from `user.identities`; POST (change password) → `supabase.auth.updateUser({password})`.
  - `api/me/create-password` → `supabase.auth.updateUser({password})` (Google-only users set a password).
  - `api/admin/users` POST → `supabase.auth.admin.createUser` + Prisma profile insert (rollback auth user if profile fails). DELETE → `admin.auth.admin.deleteUser` + profile delete. PATCH → `admin.auth.admin.updateUserById` for password reset.
- UI:
  - `login-form.tsx`: email/password → `supabase.auth.signInWithPassword`; Google → `signInWithOAuth({provider:'google', redirectTo: origin/api/auth/callback})`; eye toggle preserved; OAuth error mapping (AccessDenied/Inactive/AuthError). 
  - `forgot-password-dialog.tsx` → `supabase.auth.resetPasswordForEmail(email, {redirectTo: origin/api/auth/callback?next=/?reset=1})` (Supabase sends the email; no custom token).
  - `reset-password-form.tsx`: no longer takes a token prop — uses the active Supabase recovery session + `supabase.auth.updateUser({password})`; on success signs out + returns to login.
  - `providers.tsx`: removed SessionProvider; kept QueryClientProvider + ThemeProvider.
  - `app-shell.tsx`: replaced `useSession` with `useSupabaseSession` (new hook subscribing to `supabaseBrowser.auth.onAuthStateChange`); `signOut` → `supabaseBrowser.auth.signOut()`. role/fullName read from `/api/me` (our profile), not the Supabase user claims.
  - `profile-view.tsx`: `signOut` → `supabaseBrowser.auth.signOut()`.
  - `user-dashboard.tsx`: replaced `useSession` with `useMe()` for fullName.
- Build/deploy:
  - `package.json`: build script `next build && cp ...` → just `next build` (Vercel-friendly); `start` → `next start`; added `postinstall: prisma generate` so Vercel generates the client.
  - `next.config.ts`: removed `output: "standalone"` (Vercel uses default).
  - `.env.example` + `.env`: replaced NEXTAUTH/GOOGLE vars with `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `docs/database.sql`: rewritten for Supabase production — `profiles.id uuid FK auth.users(id)`, tasks/transactions/savings_goals with `user_id uuid FK profiles(id)`, CHECK constraints, indexes, RLS enable + owner-only policies, `handle_new_user` trigger (default role=user, is_active=false).
- `scripts/seed.ts`: uses Supabase admin API (`admin.auth.admin.createUser` + Prisma profile upsert) instead of bcrypt.
- README: updated stack table (Supabase everywhere), folder structure, added "Konfigurasi Supabase" + "Konfigurasi Vercel" step-by-step sections.

Verification:
- `bun run lint` → 0 errors.
- `bun run build` → ✓ Compiled successfully (Next.js 16 Turbopack), 12 routes generated, no warnings. Proxy (middleware) recognized.
- `grep -rn "next-auth\|bcryptjs\|bcrypt" src/ scripts/` → ZERO matches (clean migration).
- NOTE: runtime end-to-end test (login, etc.) requires real Supabase credentials + a live Supabase project, which this sandbox does not have. Build success + lint clean + code review confirm production-readiness; the user must perform runtime testing on Vercel after wiring Supabase env vars (steps documented in README sections 3b & 3c).

Stage Summary:
- Architecture: Vercel → Next.js 16 → Supabase (PostgreSQL via Prisma + Supabase Auth via @supabase/ssr). No SQLite, no NextAuth, no bcrypt, no custom server, no standalone output.
- All DailyKu features preserved (admin/user, MAX_ACTIVE_USERS=5, tasks+reminders, calendar, finance+charts, savings, calculator, dark mode, responsive, RLS-equivalent ownership checks).
- Google login rejection of unregistered users enforced in /api/auth/callback (signOut + delete orphan auth user). Inactive user rejection enforced in both callback (OAuth) and auth-guard (all routes).
- Password reset fully delegated to Supabase Auth (resetPasswordForEmail + updateUser recovery). No custom token table.
- MAX_ACTIVE_USERS unchanged in src/lib/config.ts; admin still not counted.
- User must: (1) create Supabase project, (2) run docs/database.sql, (3) set 5 env vars on Vercel, (4) configure Google OAuth in Supabase, (5) run db:seed for admin. All steps in README.

---
Task ID: SUPABASE-CONNECT
Agent: orchestrator (main)
Task: Connect existing DailyKu to user's real Supabase project (giezmrrydiuswngtuzce) and verify

Work Log:
- Audited current code: 0 next-auth/bcrypt refs, Prisma postgresql provider, env var names consistent (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, DATABASE_URL, DIRECT_URL, SUPABASE_SERVICE_ROLE_KEY).
- Updated .env with user's REAL public Supabase credentials (URL + Publishable Key — safe for frontend). Kept DATABASE_URL/DIRECT_URL/SUPABASE_SERVICE_ROLE_KEY as placeholders (secrets user must fill manually).
- Synced .env.example with the same real public values + secret placeholders.
- Verified: bun run lint → exit 0; bun run build → ✓ Compiled successfully, 12 routes, no errors.
- Verified REAL Supabase connection via Agent Browser: login page renders fully (not stuck loading), config banner gone (real creds detected), login attempt with fake user returns "Invalid login credentials" from Supabase (not "Failed to fetch") — proves app talks to project giezmrrydiuswngtuzce.
- Updated README §3: added "Status Koneksi Supabase" table showing which vars are filled vs pending, + 3-step manual config guide (run SQL, fill DB password + service key, seed admin) + Vercel env var list with actual values.
- docs/database.sql confirmed complete (4 tables + 6 RLS policies + handle_new_user trigger) — ready to run in Supabase SQL Editor.

Stage Summary:
- Supabase Auth integration is LIVE and verified — app connects to real project giezmrrydiuswngtuzce.
- What's done: code migration (NextAuth→Supabase), Prisma postgresql, build+lint clean, public creds wired, login page renders, auth endpoint reachable.
- What user must do manually (3 steps): (1) run docs/database.sql in Supabase SQL Editor, (2) fill DB password + service-role key in .env/Vercel, (3) run bun run db:seed for admin. Then login works end-to-end.
- No features removed. MAX_ACTIVE_USERS=5 unchanged. RLS + server-side ownership checks intact.
- Honest: full login flow (admin/user) NOT yet tested end-to-end because DB tables + admin user don't exist yet (needs the 3 manual steps). Auth CONNECTION is verified; data layer needs the SQL + seed.

---
Task ID: ADMIN-SETUP
Agent: orchestrator (main)
Task: Prepare admin account creation (zuraanaksoleh14@gmail.com / admin12345) — cannot create it myself (no service-role key); prepared automated + manual paths

Work Log:
- Rewrote scripts/seed.ts to read ADMIN_EMAIL + ADMIN_PASSWORD from env/CLI (not hardcoded). This keeps the user's real admin password OUT of source code / GitHub. Password is passed inline or via .env (gitignored). Script is idempotent: lists auth users, finds by email, creates if missing (email_confirm:true), upserts profile with id==auth user id, role='admin', is_active=true. Password NEVER stored in profiles (Supabase Auth owns it).
- Verified auth-guard reads role from profiles table (not OAuth claim) → user cannot self-escalate to admin.
- Verified /api/admin/users POST only creates role='user' (never admin).
- Verified /api/me PATCH only updates fullName (role/isActive never editable by user).
- Created docs/create-admin.sql with two paths: (A) seed script command, (B) manual Dashboard + SQL insert profile (for users who can't run the script).
- Updated README §3 Langkah 3 with the specific admin email + both paths.
- Lint: 0 errors. Build: ✓ success, 12 routes.

Honest status:
- Admin account NOT YET created — I cannot create it because I do not have the Supabase service-role key (correctly withheld by user; it must not be in the repo). The seed script is ready; the user must run it themselves after filling secrets in .env. This is the secure design.
- After user runs `ADMIN_EMAIL=... ADMIN_PASSWORD=... bun run db:seed` (with secrets in .env), the admin account will exist in Supabase Auth + profiles, and login at the single login page with zuraanaksoleh14@gmail.com / admin12345 will route to Admin Dashboard.
- Recommended: user changes admin12345 immediately after first login via Profil → Keamanan Akun → Ubah Password.
