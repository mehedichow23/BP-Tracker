export type BPCategory = "normal" | "elevated" | "stage1" | "stage2" | "crisis";

// AHA blood pressure categories. Order matters: checked from most to
// least severe since the ranges overlap on systolic vs diastolic.
export function categorizeBP(systolic: number, diastolic: number): BPCategory {
  if (systolic > 180 || diastolic > 120) return "crisis";
  if (systolic >= 140 || diastolic >= 90) return "stage2";
  if (systolic >= 130 || diastolic >= 80) return "stage1";
  if (systolic >= 120 && diastolic < 80) return "elevated";
  return "normal";
}

export const BP_CATEGORY_LABELS: Record<BPCategory, string> = {
  normal: "Normal",
  elevated: "Elevated",
  stage1: "Stage 1",
  stage2: "Stage 2",
  crisis: "Crisis",
};

export const BP_CATEGORY_CLASSES: Record<BPCategory, string> = {
  normal:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  elevated:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  stage1:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  stage2: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  crisis: "bg-red-700 text-white dark:bg-red-900 dark:text-red-100",
};

// Hex equivalents of BP_CATEGORY_CLASSES for @react-pdf/renderer, which
// can't use Tailwind classes.
export const BP_CATEGORY_PDF_COLORS: Record<BPCategory, { bg: string; text: string }> = {
  normal: { bg: "#d1fae5", text: "#065f46" },
  elevated: { bg: "#fef9c3", text: "#854d0e" },
  stage1: { bg: "#ffedd5", text: "#9a3412" },
  stage2: { bg: "#fee2e2", text: "#991b1b" },
  crisis: { bg: "#b91c1c", text: "#ffffff" },
};
