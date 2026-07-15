import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BPBadge } from "@/components/bp-badge";
import { DeleteReadingDialog } from "@/components/delete-reading-dialog";
import { ReadingForm } from "@/components/reading-form";
import { formatReadingDate, toDatetimeLocal } from "@/lib/dates";
import { getHouseholdContext } from "@/lib/household";
import type { ReadingFormInput } from "@/lib/validations";

export default async function ReadingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getHouseholdContext();
  if (!context) redirect("/login");
  const { supabase, user, household } = context;

  const { data: reading } = await supabase
    .from("readings")
    .select("id, user_id, systolic, diastolic, pulse, taken_at, notes")
    .eq("id", id)
    .single();

  if (!reading) notFound();

  const isOwner = reading.user_id === user.id;
  const authorName =
    household.find((m) => m.id === reading.user_id)?.display_name ?? "Unknown";

  const defaultValues: ReadingFormInput = {
    systolic: String(reading.systolic),
    diastolic: String(reading.diastolic),
    pulse: reading.pulse !== null ? String(reading.pulse) : "",
    taken_at: toDatetimeLocal(new Date(reading.taken_at)),
    notes: reading.notes ?? "",
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <Link
        href="/readings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Readings
      </Link>

      {isOwner ? (
        <>
          <h1 className="text-xl font-semibold">Edit Reading</h1>
          <ReadingForm mode="edit" readingId={reading.id} defaultValues={defaultValues} />
          <DeleteReadingDialog id={reading.id} />
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold">{authorName}&apos;s Reading</h1>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-semibold">
              {reading.systolic}/{reading.diastolic}
            </span>
            <BPBadge systolic={reading.systolic} diastolic={reading.diastolic} />
          </div>
          {reading.pulse !== null && (
            <p className="text-sm text-muted-foreground">Pulse: {reading.pulse} bpm</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formatReadingDate(reading.taken_at)}
          </p>
          {reading.notes && <p className="text-sm">{reading.notes}</p>}
        </div>
      )}
    </div>
  );
}
