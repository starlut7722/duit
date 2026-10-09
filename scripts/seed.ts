/**
 * DailyKu seed script (Supabase).
 *
 * Creates the single admin account via the Supabase Auth admin API and inserts
 * the matching `profiles` row (id == auth user id). Idempotent: safe to re-run.
 *
 * USAGE (password is read from env/CLI so it NEVER lands in source code):
 *
 *   # 1. Make sure .env has NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   #    + DATABASE_URL + DIRECT_URL filled in.
 *   # 2. Make sure docs/database.sql has been run in the Supabase SQL editor.
 *   # 3. Run:
 *   ADMIN_EMAIL="zuraanaksoleh14@gmail.com" \
 *   ADMIN_PASSWORD="admin12345" \
 *   bun run db:seed
 *
 * Or set ADMIN_EMAIL / ADMIN_PASSWORD in .env (gitignored) and just run
 * `bun run db:seed`.
 *
 * SECURITY:
 *   - The admin password is NEVER stored in the profiles table (Supabase Auth
 *     owns it). We only store email + role + is_active in `profiles`.
 *   - Do NOT commit ADMIN_PASSWORD to git. Keep it in .env (gitignored) or pass
 *     it inline.
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Read admin credentials from env so they don't live in source.
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@dailyku.test";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin DailyKu";

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Fill them in .env first (see .env.example)."
    );
    process.exit(1);
  }
  if (!ADMIN_PASSWORD) {
    console.error(
      "Missing ADMIN_PASSWORD.\n" +
        "Pass it inline:  ADMIN_PASSWORD='...' bun run db:seed\n" +
        "Or set ADMIN_PASSWORD in .env (gitignored)."
    );
    process.exit(1);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const db = new PrismaClient();

  // 1. Ensure the auth user exists (no duplicate).
  let authUserId: string | undefined;
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users?.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
  if (existing) {
    authUserId = existing.id;
    console.log(`Auth user already exists -> ${ADMIN_EMAIL} (${authUserId})`);
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // skip email verification so admin can log in immediately
    });
    if (createErr || !created?.user) {
      console.error("Failed to create auth user:", createErr?.message);
      process.exit(1);
    }
    authUserId = created.user.id;
    console.log(`Created auth user -> ${ADMIN_EMAIL} (${authUserId})`);
  }

  // 2. Upsert the admin profile. id == auth user id (same UUID).
  //    role + is_active set here; password is NEVER stored in profiles.
  await db.profile.upsert({
    where: { id: authUserId },
    update: { role: "admin", isActive: true, fullName: ADMIN_NAME, email: ADMIN_EMAIL },
    create: {
      id: authUserId,
      email: ADMIN_EMAIL,
      fullName: ADMIN_NAME,
      role: "admin",
      isActive: true,
    },
  });
  console.log("Admin profile ensured (role=admin, isActive=true).");
  console.log(`Profile id == Supabase auth user id: ${authUserId}`);

  await db.$disconnect();
  console.log(`\nAdmin login: ${ADMIN_EMAIL}`);
  console.log(
    "Password is managed by Supabase Auth (not stored in profiles). Change it after first login via Profil → Keamanan Akun."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
