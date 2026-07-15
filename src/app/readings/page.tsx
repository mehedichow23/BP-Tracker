import { subDays } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ReadingsFilters } from "@/components/readings-filters";
import { ReadingsList } from "@/components/readings-list";
import { Button } from "@/components/ui/button";
import { getHouseholdContext } from "@/lib/household";

type SearchParams = {
  person?: string;
  range?: string;
  from?: string;
  to?: string;
};

function computeDateBounds(range: string, from?: string, to?: string) {
  if (range === "custom") {
    return {
      gte: from ? `${from}T00:00:00.000Z` : undefined,
      lte: to ? `${to}T23:59:59.999Z` : undefined,
    };
  }

  const days = Number(range);
  if (!Number.isFinite(days)) return { gte: undefined, lte: undefined };

  return { gte: subDays(new Date(), days).toISOString(), lte: undefined };
}

export default async function ReadingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await getHouseholdContext();
  if (!context) redirect("/login");
  const { supabase, user, household } = context;

  const range = params.range ?? "30";
  const person = params.person ?? "both";
  const { gte, lte } = computeDateBounds(range, params.from, params.to);

  let query = supabase
    .from("readings")
    .select("id, user_id, systolic, diastolic, pulse, taken_at, notes")
    .order("taken_at", { ascending: false });

  if (person !== "both") query = query.eq("user_id", person);
  if (gte) query = query.gte("taken_at", gte);
  if (lte) query = query.lte("taken_at", lte);

  const { data: readings, error } = await query;

  const hasFilters = person !== "both" || range !== "30";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Readings</h1>
        <Button asChild size="sm">
          <Link href="/reading/new">
            <Plus className="size-4" />
            New
          </Link>
        </Button>
      </div>

      <Suspense>
        <ReadingsFilters household={household} meId={user.id} />
      </Suspense>

      {error && <p className="text-sm text-destructive">Failed to load readings.</p>}

      {!error && readings?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>{hasFilters ? "No readings match these filters." : "No readings yet."}</p>
          {!hasFilters && (
            <Button asChild>
              <Link href="/reading/new">Take your first reading</Link>
            </Button>
          )}
        </div>
      )}

      <ReadingsList readings={readings ?? []} household={household} />
    </div>
  );
}
