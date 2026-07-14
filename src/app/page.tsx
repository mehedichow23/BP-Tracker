import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 p-4">
      <p className="text-lg">
        Welcome, {profile?.display_name || user.email}
      </p>
      <SignOutButton />
    </div>
  );
}
