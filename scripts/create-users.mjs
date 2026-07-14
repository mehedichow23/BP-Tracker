// One-time setup script: creates the two household users in Supabase Auth
// and links their profiles into the same household.
//
// Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
// SEED_USER_PASSWORD in .env.local (never commit real values). Run once with:
//
//   node --env-file=.env.local scripts/create-users.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SEED_USER_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PASSWORD) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, " +
      "and SEED_USER_PASSWORD in .env.local before running this script."
  );
  process.exit(1);
}

// Fixed so re-running this script links both users into the same household
// instead of generating a new group each time. Override with SEED_HOUSEHOLD_ID
// if you need a different value.
const HOUSEHOLD_ID =
  process.env.SEED_HOUSEHOLD_ID ?? "471e5145-3e15-40b2-bfb5-41f91e72b6e2";

const USERS = [
  { email: "mehedichow23@gmail.com", display_name: "Mehedi" },
  { email: "narjis2612@gmail.com", display_name: "Narjis" },
];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

for (const user of USERS) {
  let authUser = await findUserByEmail(user.email);

  if (authUser) {
    console.log(`${user.email} already exists (${authUser.id}), updating password.`);
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: PASSWORD,
    });
    if (error) {
      console.error(`Failed to update password for ${user.email}:`, error.message);
      continue;
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
      continue;
    }
    authUser = data.user;
    console.log(`Created ${user.email} (${authUser.id}).`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: user.display_name, household_id: HOUSEHOLD_ID })
    .eq("id", authUser.id);

  if (profileError) {
    console.error(`Failed to update profile for ${user.email}:`, profileError.message);
    continue;
  }

  console.log(`Linked ${user.email} into household ${HOUSEHOLD_ID}.`);
}
