import { z } from "zod";

// Ranges match the check constraints in supabase/schema.sql exactly.
// Shared with lib/ocr.ts so OCR results are validated against the same bounds.
export const SYSTOLIC_RANGE = { min: 40, max: 300 };
export const DIASTOLIC_RANGE = { min: 20, max: 200 };
export const PULSE_RANGE = { min: 20, max: 250 };

function requiredInt(min: number, max: number, label: string) {
  return z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= min && n <= max;
    }, `${label} must be between ${min} and ${max}`);
}

function optionalInt(min: number, max: number, label: string) {
  return z.string().refine((v) => {
    if (v.trim() === "") return true;
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max;
  }, `${label} must be between ${min} and ${max}`);
}

// Every field stays a plain string here (matching what form inputs produce);
// toReadingRow() below converts validated strings into the DB row shape.
export const readingSchema = z.object({
  systolic: requiredInt(SYSTOLIC_RANGE.min, SYSTOLIC_RANGE.max, "Systolic"),
  diastolic: requiredInt(DIASTOLIC_RANGE.min, DIASTOLIC_RANGE.max, "Diastolic"),
  pulse: optionalInt(PULSE_RANGE.min, PULSE_RANGE.max, "Pulse"),
  taken_at: z
    .string()
    .min(1, "Date and time are required")
    .refine(
      (v) => !Number.isNaN(new Date(v).getTime()),
      "Enter a valid date and time"
    ),
  notes: z.string(),
});

export type ReadingFormInput = z.infer<typeof readingSchema>;

export function toReadingRow(values: ReadingFormInput) {
  return {
    systolic: Number(values.systolic),
    diastolic: Number(values.diastolic),
    pulse: values.pulse.trim() === "" ? null : Number(values.pulse),
    taken_at: new Date(values.taken_at).toISOString(),
    notes: values.notes.trim() === "" ? null : values.notes.trim(),
  };
}
