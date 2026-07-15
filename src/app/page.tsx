import { subDays } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BPBadge } from "@/components/bp-badge";
import { DashboardTrendChart } from "@/components/dashboard-trend-chart";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatReadingDate } from "@/lib/dates";
import { getHouseholdContext } from "@/lib/household";

export default async function DashboardPage() {
  const context = await getHouseholdContext();
  if (!context) redirect("/login");
  const { supabase, user, me, household } = context;

  const latestByMember = await Promise.all(
    household.map(async (member) => {
      const { data } = await supabase
        .from("readings")
        .select("systolic, diastolic, pulse, taken_at")
        .eq("user_id", member.id)
        .order("taken_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { member, latest: data };
    })
  );

  const { data: trendReadings } = await supabase
    .from("readings")
    .select("user_id, systolic, diastolic, taken_at")
    .gte("taken_at", subDays(new Date(), 30).toISOString())
    .order("taken_at", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <p className="text-lg">Welcome, {me?.display_name || user.email}</p>
        <SignOutButton />
      </div>

      <div className="flex flex-col gap-3">
        {latestByMember.map(({ member, latest }) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle className="text-base">{member.display_name}</CardTitle>
            </CardHeader>
            <CardContent>
              {latest ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold">
                      {latest.systolic}/{latest.diastolic}
                    </span>
                    <BPBadge systolic={latest.systolic} diastolic={latest.diastolic} />
                  </div>
                  {latest.pulse !== null && (
                    <span className="text-sm text-muted-foreground">
                      {latest.pulse} bpm
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatReadingDate(latest.taken_at)}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No readings yet</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardTrendChart readings={trendReadings ?? []} household={household} />

      <Button asChild size="lg" className="h-14 w-full text-base">
        <Link href="/reading/new">Take Reading</Link>
      </Button>

      <Button asChild variant="outline">
        <Link href="/readings">View all readings</Link>
      </Button>
    </div>
  );
}
