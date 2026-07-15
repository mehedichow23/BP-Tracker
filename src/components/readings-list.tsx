"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BPBadge } from "@/components/bp-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatReadingDate } from "@/lib/dates";
import type { HouseholdMember } from "@/lib/household";
import type { BPLogReading } from "@/lib/pdf/bp-log-document";

type ReadingRow = {
  id: string;
  user_id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  taken_at: string;
  notes: string | null;
};

function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function ReadingsList({
  readings,
  household,
}: {
  readings: ReadingRow[];
  household: HouseholdMember[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const nameById = useMemo(
    () => new Map(household.map((m) => [m.id, m.display_name])),
    [household]
  );

  if (readings.length === 0) return null;

  const allSelected = selected.size === readings.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(readings.map((r) => r.id)) : new Set());
  }

  async function handleExport() {
    const chosen = readings.filter((r) => selected.has(r.id));
    const personsLabel = joinNames(
      Array.from(new Set(chosen.map((r) => nameById.get(r.user_id) ?? "Unknown")))
    );
    const pdfReadings: BPLogReading[] = chosen.map((r) => ({
      id: r.id,
      systolic: r.systolic,
      diastolic: r.diastolic,
      pulse: r.pulse,
      taken_at: r.taken_at,
      notes: r.notes,
    }));

    setExporting(true);
    try {
      const { exportReadingsToPdf } = await import("@/lib/pdf/export-readings");
      const outcome = await exportReadingsToPdf(pdfReadings, personsLabel);
      if (outcome === "shared") {
        toast.success("PDF shared");
      } else if (outcome === "downloaded") {
        toast.success("PDF downloaded");
      } else {
        toast("Share cancelled");
      }
    } catch {
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => toggleAll(checked === true)}
          />
          Select all {readings.length}
        </label>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Clear
          </button>
        )}
      </div>

      <div className={`flex flex-col gap-2 ${selected.size > 0 ? "pb-20" : ""}`}>
        {readings.map((reading) => (
          <div
            key={reading.id}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.has(reading.id)}
              onCheckedChange={() => toggleOne(reading.id)}
              aria-label="Select reading"
            />
            <Link href={`/readings/${reading.id}`} className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {nameById.get(reading.user_id) ?? "Unknown"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatReadingDate(reading.taken_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {reading.systolic}/{reading.diastolic}
                </span>
                <BPBadge systolic={reading.systolic} diastolic={reading.diastolic} />
                {reading.pulse !== null && (
                  <span className="text-sm text-muted-foreground">{reading.pulse} bpm</span>
                )}
              </div>
              {reading.notes && (
                <p className="truncate text-sm text-muted-foreground">{reading.notes}</p>
              )}
            </Link>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 shadow-lg">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button size="lg" className="h-12" disabled={exporting} onClick={handleExport}>
              {exporting ? "Generating..." : `Export ${selected.size} readings`}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
