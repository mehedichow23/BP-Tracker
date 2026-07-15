import { createClient } from "@/lib/supabase/server";

export type HouseholdMember = {
  id: string;
  display_name: string;
};

export async function getHouseholdContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name");

  const household: HouseholdMember[] = profiles ?? [];
  const me = household.find((p) => p.id === user.id) ?? null;

  return { supabase, user, me, household };
}
