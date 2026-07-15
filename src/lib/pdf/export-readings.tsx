import { pdf } from "@react-pdf/renderer";
import { format } from "date-fns";

import { BPLogDocument, type BPLogReading } from "@/lib/pdf/bp-log-document";

export type ExportOutcome = "shared" | "downloaded" | "cancelled";

export async function exportReadingsToPdf(
  readings: BPLogReading[],
  personsLabel: string
): Promise<ExportOutcome> {
  const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const sorted = [...readings].sort((a, b) => a.taken_at.localeCompare(b.taken_at));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const blob = await pdf(
    <BPLogDocument readings={readings} personsLabel={personsLabel} timezoneLabel={timezoneLabel} />
  ).toBlob();

  const startSlug = first ? format(new Date(first.taken_at), "yyyy-MM-dd") : "export";
  const endSlug = last ? format(new Date(last.taken_at), "yyyy-MM-dd") : "export";
  const filename = `bp-log-${startSlug}-to-${endSlug}.pdf`;
  const file = new File([blob], filename, { type: "application/pdf" });

  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "cancelled";
      }
      throw error;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return "downloaded";
}
