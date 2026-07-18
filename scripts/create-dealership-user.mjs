// One-off: create (or reuse) the EV Nepal dealership auth user that owns all
// existing seed vehicles. Loads env from .env.local (falls back to .env),
// uses the Supabase service-role key, and prints the user id + password.
//
//   node scripts/create-dealership-user.mjs
//
// Env vars used (same names as the app — see lib/supabase.ts / .env):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

// Minimal .env parser so this script has no dotenv dependency.
function loadEnvFile(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = {
  ...loadEnvFile(resolve(repoRoot, ".env")),
  ...loadEnvFile(resolve(repoRoot, ".env.local")),
  ...process.env,
};

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env(.local)."
  );
  process.exit(1);
}

const EMAIL = "dealership@evnepal.local";
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findExistingByEmail(email) {
  // Page through admin.listUsers until we find a match.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  const password = randomBytes(18).toString("base64url"); // ~24 chars, url-safe

  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "EV Nepal Dealership",
      account_type: "dealer",
    },
  });

  if (error) {
    const msg = error.message || "";
    if (/already|exists|registered|duplicate/i.test(msg)) {
      const existing = await findExistingByEmail(EMAIL);
      if (!existing) {
        console.error("User reported as existing but could not be found:", msg);
        process.exit(1);
      }
      console.log(JSON.stringify({
        status: "existing",
        id: existing.id,
        email: existing.email,
        password: null,
        note: "User already existed; password unchanged/unknown.",
      }, null, 2));
      return;
    }
    console.error("createUser failed:", msg);
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: "created",
    id: data.user.id,
    email: data.user.email,
    password,
    account_type: "dealer",
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
