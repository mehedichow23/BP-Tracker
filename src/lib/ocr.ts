import { z } from "zod";

import { DIASTOLIC_RANGE, PULSE_RANGE, SYSTOLIC_RANGE } from "@/lib/validations";

function numberInRange(min: number, max: number) {
  return z
    .union([z.null(), z.number().int().min(min).max(max)])
    .catch(null);
}

const FALLBACK_RESULT = {
  systolic: null,
  diastolic: null,
  pulse: null,
  confidence: "low",
} as const;

// Any field (or the whole object) that fails validation falls back to null /
// "low" rather than throwing, matching the DB check constraints exactly.
export const ocrResultSchema = z
  .object({
    systolic: numberInRange(SYSTOLIC_RANGE.min, SYSTOLIC_RANGE.max),
    diastolic: numberInRange(DIASTOLIC_RANGE.min, DIASTOLIC_RANGE.max),
    pulse: numberInRange(PULSE_RANGE.min, PULSE_RANGE.max),
    confidence: z.enum(["high", "medium", "low"]).catch("low"),
  })
  .catch(FALLBACK_RESULT);

export type OcrResult = z.infer<typeof ocrResultSchema>;

export const OCR_FALLBACK_RESULT: OcrResult = FALLBACK_RESULT;

export const OCR_SYSTEM_PROMPT = `You are reading a digital blood pressure monitor display from a photo.

Respond with ONLY strict JSON. No markdown formatting, no code fences, no explanation, no preamble, no text before or after the JSON object. The response must be exactly this shape:

{"systolic": number|null, "diastolic": number|null, "pulse": number|null, "confidence": "high"|"medium"|"low"}

Reading the display:
- Systolic (SYS) is the top or largest number shown.
- Diastolic (DIA) is the middle number shown.
- Pulse is the bottom number, often shown next to a heart icon.

If any value is not clearly readable, use null for that field. Set "confidence" to "high" only if you are confident all visible values were read correctly, "medium" if some values are uncertain, and "low" if the display is hard to read or mostly unreadable.`;
